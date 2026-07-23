import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IncidentDocument = Incident & Document;

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Incident {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: IncidentSeverity, required: true })
  severity: IncidentSeverity;

  @Prop({ type: String, enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy: Types.ObjectId;

  @Prop()
  closedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
