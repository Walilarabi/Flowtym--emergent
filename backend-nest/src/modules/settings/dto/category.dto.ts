/**
 * Category DTOs
 */

import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { CategoryType } from '../schemas/category.schema';

export class CreateCategoryDto {
  @IsEnum(CategoryType)
  type: CategoryType;

  @IsString()
  name: string;

  @IsString()
  icon: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
