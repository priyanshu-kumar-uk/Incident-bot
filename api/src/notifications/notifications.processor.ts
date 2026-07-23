import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { NotificationsService, NOTIFICATION_QUEUE } from './notifications.service';
import { NotificationStatus } from '../database/schemas/notification.schema';

interface SendTelegramJobData {
  notificationId: string;
  userId: string;
  chatId: string;
  incident: {
    title: string;
    description: string;
    severity: string;
    status: string;
  };
  isCritical: boolean;
}

interface SendApprovalJobData {
  notificationId: string;
  userId: string;
  chatId: string;
  userName: string;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private telegramService: TelegramService,
    private notificationsService: NotificationsService,
  ) {}

  @Process('send-telegram')
  async handleSendTelegram(job: Job<SendTelegramJobData>): Promise<void> {
    const { notificationId, chatId, incident, isCritical } = job.data;
    this.logger.log(`Processing Telegram notification ${notificationId} (attempt ${job.attemptsMade + 1})`);

    try {
      const message = await this.telegramService.sendIncidentMessage(chatId, incident, isCritical);
      await this.notificationsService.updateStatus(notificationId, NotificationStatus.SENT, {
        telegramMessageId: message?.message_id?.toString(),
        retryCount: job.attemptsMade,
      } as any);
      this.logger.log(`Telegram notification ${notificationId} sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification ${notificationId}: ${error.message}`);
      await this.notificationsService.updateStatus(notificationId, NotificationStatus.FAILED, {
        errorMessage: error.message,
        retryCount: job.attemptsMade + 1,
      } as any);
      throw error; // Re-throw to trigger BullMQ retry
    }
  }

  @Process('send-approval')
  async handleSendApproval(job: Job<SendApprovalJobData>): Promise<void> {
    const { notificationId, chatId, userName } = job.data;
    this.logger.log(`Processing approval notification ${notificationId}`);

    try {
      await this.telegramService.sendApprovalMessage(chatId, userName);
      await this.notificationsService.updateStatus(notificationId, NotificationStatus.SENT, {
        retryCount: job.attemptsMade,
      } as any);
    } catch (error) {
      this.logger.error(`Failed to send approval notification ${notificationId}: ${error.message}`);
      await this.notificationsService.updateStatus(notificationId, NotificationStatus.FAILED, {
        errorMessage: error.message,
        retryCount: job.attemptsMade + 1,
      } as any);
      throw error;
    }
  }
}
