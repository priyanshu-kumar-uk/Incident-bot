import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/schemas/user.schema';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()

  async getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auditLogsService.findAll(page, limit);
  }
}
