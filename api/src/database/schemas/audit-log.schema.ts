import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  USER_APPROVED = 'USER_APPROVED',
  USER_REJECTED = 'USER_REJECTED',
  INCIDENT_CREATED = 'INCIDENT_CREATED',
  INCIDENT_CLOSED = 'INCIDENT_CLOSED',
  TELEGRAM_CONNECTED = 'TELEGRAM_CONNECTED',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorId: Types.ObjectId;

  @Prop({ type: String, enum: AuditAction, required: true, index: true })
  action: AuditAction;

  @Prop({ required: true })
  entityType: string;

  @Prop({ type: Types.ObjectId })
  entityId: Types.ObjectId;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;

  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
