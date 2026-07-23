import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

import { IncidentSeverity } from '../../database/schemas/incident.schema';

export class CreateIncidentDto {

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  title: string;


  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  description: string;


  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;
}
