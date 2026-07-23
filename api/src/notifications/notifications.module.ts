import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService, NOTIFICATION_QUEUE } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsScheduler } from './notifications.scheduler';
import { Notification, NotificationSchema } from '../database/schemas/notification.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { Incident, IncidentSchema } from '../database/schemas/incident.schema';
import { TelegramModule } from '../telegram/telegram.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
    BullModule.registerQueueAsync({
      name: NOTIFICATION_QUEUE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    TelegramModule,
    WebsocketModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
