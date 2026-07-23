import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incident, IncidentDocument, IncidentStatus, IncidentSeverity } from '../database/schemas/incident.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(@InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>) {}

  async create(dto: CreateIncidentDto, createdById: string): Promise<IncidentDocument> {
    const incident = new this.incidentModel({
      ...dto,
      createdBy: new Types.ObjectId(createdById),
    });
    return incident.save();
  }

  async findAll(page = 1, limit = 20, search?: string, status?: IncidentStatus) {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      query['$or'] = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [incidents, total] = await Promise.all([
      this.incidentModel
        .find(query)
        .populate('createdBy', 'name email avatar')
        .populate('closedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.incidentModel.countDocuments(query).exec(),
    ]);
    return { incidents, total, page, limit };
  }

  async findById(id: string): Promise<IncidentDocument> {
    const incident = await this.incidentModel
      .findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('closedBy', 'name email avatar')
      .exec();
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async close(id: string, closedById: string): Promise<IncidentDocument> {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) throw new NotFoundException('Incident not found');
    incident.status = IncidentStatus.CLOSED;
    incident.closedBy = new Types.ObjectId(closedById);
    incident.closedAt = new Date();
    return incident.save();
  }

  async countOpen(): Promise<number> {
    return this.incidentModel.countDocuments({ status: IncidentStatus.OPEN }).exec();
  }

  async countCriticalOpen(): Promise<number> {
    return this.incidentModel.countDocuments({ status: IncidentStatus.OPEN, severity: IncidentSeverity.CRITICAL }).exec();
  }

  async findOpenIncidents(): Promise<IncidentDocument[]> {
    return this.incidentModel.find({ status: IncidentStatus.OPEN }).exec();
  }

  async getRecentIncidents(limit = 5): Promise<IncidentDocument[]> {
    return this.incidentModel
      .find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
