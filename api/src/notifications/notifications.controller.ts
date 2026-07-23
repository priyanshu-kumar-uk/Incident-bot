import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/schemas/user.schema';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()

  async getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.notificationsService.findAll(page, limit);
  }

  @Get(':id')

  async getOne(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }
}
