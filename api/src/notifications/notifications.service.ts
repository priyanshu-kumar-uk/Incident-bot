import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
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
      await this.telegramService.sendApprovalMessage(user.telegramChatId, user.name);
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notification.save();
      this.eventsGateway.emitNotificationUpdated(notification);
    } catch {
      try {
        await this.notificationQueue.add(
          'send-approval',
          {
            notificationId: notification._id.toString(),
            userId: user._id.toString(),
            chatId: user.telegramChatId,
            userName: user.name,
          },
          {
            attempts: 3,
            backoff: { type: 'fixed', delay: 3000 },
            removeOnComplete: 20,
          },
        );
      } catch {}
    }
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find()
        .populate('userId', 'name email avatar')
        .populate('incidentId', 'title severity status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments().exec(),
    ]);
    return { notifications, total, page, limit };
  }

  async findById(id: string): Promise<NotificationDocument> {
    return this.notificationModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('incidentId', 'title severity')
      .exec();
  }

  async updateStatus(id: string, status: NotificationStatus, meta?: Partial<NotificationDocument>): Promise<void> {
    await this.notificationModel.findByIdAndUpdate(id, {
      status,
      ...meta,
      ...(status === NotificationStatus.SENT ? { sentAt: new Date() } : {}),
    }).exec();

    const updated = await this.notificationModel.findById(id)
      .populate('userId', 'name email')
      .populate('incidentId', 'title severity')
      .exec();
    this.eventsGateway.emitNotificationUpdated(updated);
  }

  async getRecentNotifications(limit = 10) {
    return this.notificationModel
      .find()
      .populate('userId', 'name email')
      .populate('incidentId', 'title severity')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async hasRecentNotification(userId: string, incidentId: string): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const exists = await this.notificationModel.findOne({
      userId: new Types.ObjectId(userId),
      incidentId: new Types.ObjectId(incidentId),
      createdAt: { $gte: fiveMinutesAgo },
      status: NotificationStatus.SENT,
    }).exec();
    return !!exists;
  }
}
