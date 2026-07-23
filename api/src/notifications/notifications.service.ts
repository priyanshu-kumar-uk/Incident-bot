import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationStatus, NotificationType, NotificationChannel } from '../database/schemas/notification.schema';
import { User, UserDocument, UserStatus } from '../database/schemas/user.schema';
import { IncidentDocument, IncidentSeverity } from '../database/schemas/incident.schema';
import { EventsGateway } from '../websocket/events.gateway';
import { TelegramService } from '../telegram/telegram.service';

export const NOTIFICATION_QUEUE = 'notifications';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private eventsGateway: EventsGateway,
    private telegramService: TelegramService,
  ) {}

  async queueIncidentNotifications(incident: IncidentDocument): Promise<void> {
    const eligibleUsers = await this.userModel.find({
      status: UserStatus.APPROVED,
      $or: [
        { telegramConnected: true },
        { telegramChatId: { $exists: true, $ne: null } },
      ],
    }).exec();

    this.logger.log(`Queuing notifications for ${eligibleUsers.length} users for incident: ${incident.title}`);

    const sentChatIds = new Set<string>();

    for (const user of eligibleUsers) {
      if (!user.telegramChatId) continue;

      const notification = new this.notificationModel({
        userId: user._id,
        incidentId: incident._id,
        type: incident.severity === IncidentSeverity.CRITICAL
          ? NotificationType.CRITICAL_INCIDENT
          : NotificationType.INCIDENT,
        channel: NotificationChannel.TELEGRAM,
        status: NotificationStatus.PENDING,
      });
      await notification.save();

      // Deduplicate: If telegramChatId already received this incident's message, update DB status without re-dispatching Telegram API
      if (sentChatIds.has(user.telegramChatId)) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        await notification.save();
        this.eventsGateway.emitNotificationUpdated(notification);
        continue;
      }

      // 1. Try sending directly via Telegram Bot for instant delivery
      try {
        const isCritical = incident.severity === IncidentSeverity.CRITICAL;
        const msg = await this.telegramService.sendIncidentMessage(
          user.telegramChatId,
          {
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            status: incident.status,
          },
          isCritical,
        );

        if (msg) {
          sentChatIds.add(user.telegramChatId);
          notification.status = NotificationStatus.SENT;
          notification.sentAt = new Date();
          notification.telegramMessageId = msg.message_id?.toString();
          await notification.save();
          this.eventsGateway.emitNotificationUpdated(notification);
          this.logger.log(`Direct Telegram notification sent to ${user.name} (${user.email})`);
          continue;
        }
      } catch (err) {
        this.logger.warn(`Direct Telegram send failed for user ${user._id}: ${err.message}, attempting queue`);
      }

      // 2. Queue via BullMQ if direct send was not completed
      try {
        await this.notificationQueue.add(
          'send-telegram',
          {
            notificationId: notification._id.toString(),
            userId: user._id.toString(),
            chatId: user.telegramChatId,
            incident: {
              title: incident.title,
              description: incident.description,
              severity: incident.severity,
              status: incident.status,
            },
            isCritical: incident.severity === IncidentSeverity.CRITICAL,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        );
        sentChatIds.add(user.telegramChatId);
      } catch (queueErr) {
        this.logger.error(`BullMQ queue failed for user ${user._id}: ${queueErr.message}`);
      }
    }
  }

  async sendApprovalNotification(user: UserDocument): Promise<void> {
    if (!user.telegramChatId) return;

    const notification = new this.notificationModel({
      userId: user._id,
      type: NotificationType.APPROVAL,
      channel: NotificationChannel.TELEGRAM,
      status: NotificationStatus.PENDING,
    });
    await notification.save();

    try {
      const msg = await this.telegramService.sendApprovalMessage(user.telegramChatId, user.name);
      if (msg) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        notification.telegramMessageId = msg.message_id?.toString();
        await notification.save();
        this.eventsGateway.emitNotificationUpdated(notification);
        this.logger.log(`Approval notification sent to ${user.name} (${user.email})`);
      }
    } catch (err) {
      this.logger.error(`Failed to send approval notification to ${user._id}: ${err.message}`);
    }
  }

  async findAll(page = 1, limit = 20) {
    return this.getAllNotifications(page, limit);
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findById(id)
      .populate('userId', 'name email avatar')
      .populate('incidentId')
      .exec();
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('incidentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
    ]);

    return { notifications, total, page, limit };
  }

  async getAllNotifications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find()
        .populate('userId', 'name email avatar')
        .populate('incidentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments().exec(),
    ]);

    return { notifications, total, page, limit };
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    extraData?: { telegramMessageId?: string; errorMessage?: string; retryCount?: number },
  ): Promise<NotificationDocument | null> {
    const update: Record<string, unknown> = { status };
    if (status === NotificationStatus.SENT) {
      update['sentAt'] = new Date();
    }
    if (extraData?.telegramMessageId) {
      update['telegramMessageId'] = extraData.telegramMessageId;
    }
    if (extraData?.errorMessage) {
      update['errorMessage'] = extraData.errorMessage;
    }
    if (extraData?.retryCount !== undefined) {
      update['retryCount'] = extraData.retryCount;
    }

    const updated = await this.notificationModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (updated) {
      this.eventsGateway.emitNotificationUpdated(updated);
    }

    return updated;
  }

  async hasRecentNotification(userId: string, incidentId: string): Promise<boolean> {
    const count = await this.notificationModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        incidentId: new Types.ObjectId(incidentId),
        status: { $in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
      })
      .exec();

    return count > 0;
  }
}
