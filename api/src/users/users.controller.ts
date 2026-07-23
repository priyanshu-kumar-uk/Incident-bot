import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, UserDocument } from '../database/schemas/user.schema';
import { QueryUsersDto } from './dto/query-users.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../database/schemas/audit-log.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../websocket/events.gateway';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  @Get('pending')
  @Roles(UserRole.ADMIN)

  async getPendingUsers(@Query() query: QueryUsersDto) {
    return this.usersService.getPendingUsers(query.search, query.page, query.limit);
  }

  @Get('approved')
  @Roles(UserRole.ADMIN)

  async getApprovedUsers(@Query() query: QueryUsersDto) {
    return this.usersService.getApprovedUsers(query.search, query.page, query.limit);
  }

  @Get('rejected')
  @Roles(UserRole.ADMIN)

  async getRejectedUsers(@Query() query: QueryUsersDto) {
    return this.usersService.getRejectedUsers(query.search, query.page, query.limit);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)

  async approveUser(@Param('id') id: string, @CurrentUser() actor: UserDocument) {
    const user = await this.usersService.approveUser(id);

    // Audit log
    await this.auditLogsService.log({
      actorId: actor._id.toString(),
      action: AuditAction.USER_APPROVED,
      entityType: 'User',
      entityId: id,
      metadata: { email: user.email, name: user.name },
    });

    // Send Telegram approval notification
    await this.notificationsService.sendApprovalNotification(user);

    // WebSocket broadcast
    this.eventsGateway.emitUserApproved(user);

    return { message: 'User approved successfully', user };
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)

  async rejectUser(@Param('id') id: string, @CurrentUser() actor: UserDocument) {
    const user = await this.usersService.rejectUser(id);

    // Audit log
    await this.auditLogsService.log({
      actorId: actor._id.toString(),
      action: AuditAction.USER_REJECTED,
      entityType: 'User',
      entityId: id,
      metadata: { email: user.email, name: user.name },
    });

    // WebSocket broadcast
    this.eventsGateway.emitUserRejected(user);

    return { message: 'User rejected', user };
  }
}
