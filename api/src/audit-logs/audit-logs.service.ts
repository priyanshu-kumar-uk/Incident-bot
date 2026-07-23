import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument, AuditAction } from '../database/schemas/audit-log.schema';

interface CreateAuditLogDto {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogsService {
  constructor(@InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const log = new this.auditLogModel({
      actorId: new Types.ObjectId(dto.actorId),
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId ? new Types.ObjectId(dto.entityId) : undefined,
      metadata: dto.metadata,
    });
    return log.save();
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find()
        .populate('actorId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments().exec(),
    ]);
    return { logs, total, page, limit };
  }
}
