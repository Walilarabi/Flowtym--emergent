/**
 * Category Controller - API pour gérer les catégories (Configuration Direction)
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CategoryType } from '../schemas/category.schema';

@Controller('hotels/:hotelId/settings/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /api/v2/hotels/:hotelId/settings/categories
   * Récupérer toutes les catégories
   */
  @Get()
  async findAll(@Param('hotelId') hotelId: string) {
    return this.categoryService.findAll(hotelId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/settings/categories/reports
   * Récupérer les catégories de signalements
   */
  @Get('reports')
  async findReportCategories(
    @Param('hotelId') hotelId: string,
    @Query('activeOnly') activeOnly: string = 'true'
  ) {
    return this.categoryService.findByType(
      hotelId, 
      CategoryType.REPORT, 
      activeOnly === 'true'
    );
  }

  /**
   * GET /api/v2/hotels/:hotelId/settings/categories/found-items
   * Récupérer les catégories d'objets trouvés
   */
  @Get('found-items')
  async findFoundItemCategories(
    @Param('hotelId') hotelId: string,
    @Query('activeOnly') activeOnly: string = 'true'
  ) {
    return this.categoryService.findByType(
      hotelId, 
      CategoryType.FOUND_ITEM, 
      activeOnly === 'true'
    );
  }

  /**
   * POST /api/v2/hotels/:hotelId/settings/categories
   * Créer une nouvelle catégorie
   */
  @Post()
  async create(
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateCategoryDto
  ) {
    return this.categoryService.create(hotelId, dto);
  }

  /**
   * PUT /api/v2/hotels/:hotelId/settings/categories/:categoryId
   * Mettre à jour une catégorie
   */
  @Put(':categoryId')
  async update(
    @Param('hotelId') hotelId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categoryService.update(hotelId, categoryId, dto);
  }

  /**
   * DELETE /api/v2/hotels/:hotelId/settings/categories/:categoryId
   * Supprimer une catégorie (soft delete)
   */
  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('hotelId') hotelId: string,
    @Param('categoryId') categoryId: string
  ) {
    await this.categoryService.delete(hotelId, categoryId);
  }

  /**
   * POST /api/v2/hotels/:hotelId/settings/categories/reorder
   * Réordonner les catégories
   */
  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param('hotelId') hotelId: string,
    @Body() body: { type: CategoryType; categoryIds: string[] }
  ) {
    await this.categoryService.reorder(hotelId, body.type, body.categoryIds);
  }
}
