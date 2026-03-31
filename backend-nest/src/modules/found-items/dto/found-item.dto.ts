/**
 * FoundItem DTOs
 */

import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { FoundItemStatus } from '../schemas/found-item.schema';

export class CreateFoundItemDto {
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
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location_found?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsString()
  reporter_id: string;

  @IsString()
  reporter_name: string;
}

export class UpdateFoundItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location_found?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;
}

export class ReturnFoundItemDto {
  @IsString()
  recipient_name: string;

  @IsOptional()
  @IsString()
  recipient_id_photo_url?: string;

  @IsString()
  returned_by_id: string;

  @IsString()
  returned_by_name: string;
}

export class ConsignFoundItemDto {
  @IsString()
  consigned_by_id: string;

  @IsString()
  consigned_by_name: string;

  @IsEnum(['kept', 'destroyed', 'donated'])
  consign_action: 'kept' | 'destroyed' | 'donated';

  @IsOptional()
  @IsString()
  consign_notes?: string;
}

export class UpdateConsignDaysDto {
  @IsNumber()
  days_until_consign: number;
}
