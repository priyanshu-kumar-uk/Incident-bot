import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

import { UserStatus } from '../../database/schemas/user.schema';

export class QueryUsersDto {

  @IsOptional()
  @IsString()
  search?: string;


  @IsOptional()
  page?: number;


  @IsOptional()
  limit?: number;
}
