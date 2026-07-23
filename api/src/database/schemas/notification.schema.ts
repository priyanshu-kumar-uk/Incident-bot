import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  APPROVAL = 'APPROVAL',
  INCIDENT = 'INCIDENT',
  CRITICAL_INCIDENT = 'CRITICAL_INCIDENT',
}

export enum NotificationChannel {
  TELEGRAM = 'TELEGRAM',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Incident', index: true })
  incidentId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: String, enum: NotificationChannel, default: NotificationChannel.TELEGRAM })
  channel: NotificationChannel;

  @Prop({ type: String, enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop()
  telegramMessageId: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  errorMessage: string;

  @Prop()
  sentAt: Date;

  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index to prevent duplicate notifications
NotificationSchema.index({ userId: 1, incidentId: 1, type: 1 }, { unique: false });
