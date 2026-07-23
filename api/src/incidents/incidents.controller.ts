import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, UserDocument } from '../database/schemas/user.schema';
import { IncidentStatus } from '../database/schemas/incident.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../database/schemas/audit-log.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(
    private incidentsService: IncidentsService,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createIncident(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() actor: UserDocument,
  ) {
    const incident = await this.incidentsService.create(dto, actor._id.toString());

    // Audit log
    await this.auditLogsService.log({
      actorId: actor._id.toString(),
      action: AuditAction.INCIDENT_CREATED,
      entityType: 'Incident',
      entityId: incident._id.toString(),
      metadata: { title: incident.title, severity: incident.severity },
    });

    // Queue & send Telegram notifications to approved users
    await this.notificationsService.queueIncidentNotifications(incident);

    // WebSocket broadcast to all connected clients
    this.eventsGateway.emitIncidentCreated(incident);

    return incident;
  }

  // All approved users (ADMIN & USER) can view incidents
  @Get()
  async getIncidents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: IncidentStatus,
  ) {
    return this.incidentsService.findAll(page, limit, search, status);
  }

  @Get(':id')
  async getIncident(@Param('id') id: string) {
    return this.incidentsService.findById(id);
  }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN)
  async closeIncident(@Param('id') id: string, @CurrentUser() actor: UserDocument) {
    const incident = await this.incidentsService.close(id, actor._id.toString());

    // Audit log
    await this.auditLogsService.log({
      actorId: actor._id.toString(),
      action: AuditAction.INCIDENT_CLOSED,
      entityType: 'Incident',
      entityId: id,
      metadata: { title: incident.title },
    });

    // WebSocket broadcast
    this.eventsGateway.emitIncidentClosed(incident);

    return { message: 'Incident closed successfully', incident };
  }
}
