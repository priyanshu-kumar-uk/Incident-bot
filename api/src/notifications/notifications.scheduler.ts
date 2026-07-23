import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../database/schemas/user.schema';
import { IncidentDocument, IncidentStatus } from '../database/schemas/incident.schema';
import { Incident } from '../database/schemas/incident.schema';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('*/5 * * * *') // Every 5 minutes
  async runScheduledNotifications(): Promise<void> {
    this.logger.log('Running scheduled notification check...');

    try {
      const openIncidents = await this.incidentModel
        .find({ status: IncidentStatus.OPEN })
        .exec();

      if (openIncidents.length === 0) {
        this.logger.log('No open incidents found');
        return;
      }

      const eligibleUsers = await this.userModel
        .find({ status: UserStatus.APPROVED, telegramConnected: true })
        .exec();

      if (eligibleUsers.length === 0) {
        this.logger.log('No eligible users for notifications');
        return;
      }

      let queued = 0;
      for (const incident of openIncidents) {
        for (const user of eligibleUsers) {
          const alreadyNotified = await this.notificationsService.hasRecentNotification(
            user._id.toString(),
            incident._id.toString(),
          );

          if (!alreadyNotified) {
            await this.notificationsService.queueIncidentNotifications(incident);
            queued++;
            break; // Avoid re-queuing for same incident multiple times per user
          }
        }
      }

      this.logger.log(`Scheduled job complete: ${queued} notifications queued for ${openIncidents.length} open incidents`);
    } catch (error) {
      this.logger.error(`Scheduled notification job failed: ${error.message}`);
    }
  }
}
