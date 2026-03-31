/**
 * Report DTOs
 */

import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportPriority, ReportStatus } from '../schemas/report.schema';

export class CreateReportDto {
  @IsString()
  room_number: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsString()
  category_name: string;

  @IsOptional()
  @IsString()
  category_icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsString()
  reporter_id: string;

  @IsString()
  reporter_name: string;

  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;
}

export class TakeOverReportDto {
  @IsString()
  technician_id: string;

  @IsString()
  technician_name: string;
}

export class AddCommentDto {
  @IsString()
  author_id: string;

  @IsString()
  author_name: string;

  @IsString()
  content: string;
}

export class AddInvoiceDto {
  @IsString()
  invoice_url: string;

  @IsOptional()
  @IsNumber()
  invoice_amount?: number;
}

export class ResolveReportDto {
  @IsOptional()
  @IsString()
  resolution_notes?: string;

  @IsString()
  resolved_by_id: string;

  @IsString()
  resolved_by_name: string;
}
