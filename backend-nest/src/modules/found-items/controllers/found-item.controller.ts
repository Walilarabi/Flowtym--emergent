/**
 * FoundItem Controller - API pour les objets trouvés
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FoundItemService } from '../services/found-item.service';
import { 
  CreateFoundItemDto, 
  UpdateFoundItemDto, 
  ReturnFoundItemDto, 
  ConsignFoundItemDto 
} from '../dto/found-item.dto';
import { FoundItemStatus } from '../schemas/found-item.schema';

@Controller('hotels/:hotelId/found-items')
export class FoundItemController {
  constructor(private readonly foundItemService: FoundItemService) {}

  /**
   * GET /api/v2/hotels/:hotelId/found-items
   * Récupérer tous les objets trouvés
   */
  @Get()
  async findAll(
    @Param('hotelId') hotelId: string,
    @Query('status') status?: FoundItemStatus
  ) {
    return this.foundItemService.findAll(hotelId, status);
  }

  /**
   * GET /api/v2/hotels/:hotelId/found-items/stats
   * Récupérer les statistiques
   */
  @Get('stats')
  async getStats(@Param('hotelId') hotelId: string) {
    return this.foundItemService.getStats(hotelId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/found-items/grouped
   * Récupérer les objets groupés par date
   */
  @Get('grouped')
  async findGroupedByDate(@Param('hotelId') hotelId: string) {
    return this.foundItemService.findGroupedByDate(hotelId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/found-items/search
   * Rechercher des objets trouvés
   */
  @Get('search')
  async search(
    @Param('hotelId') hotelId: string,
    @Query('q') query: string
  ) {
    return this.foundItemService.search(hotelId, query || '');
  }

  /**
   * GET /api/v2/hotels/:hotelId/found-items/to-consign
   * Récupérer les objets à consigner
   */
  @Get('to-consign')
  async findItemsToConsign(@Param('hotelId') hotelId: string) {
    return this.foundItemService.findItemsToConsign(hotelId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/found-items/room/:roomNumber
   * Récupérer les objets trouvés d'une chambre
   */
  @Get('room/:roomNumber')
  async findByRoom(
    @Param('hotelId') hotelId: string,
    @Param('roomNumber') roomNumber: string
  ) {
    return this.foundItemService.findByRoom(hotelId, roomNumber);
  }

  /**
   * GET /api/v2/hotels/:hotelId/found-items/:itemId
   * Récupérer un objet trouvé par ID
   */
  @Get(':itemId')
  async findById(
    @Param('hotelId') hotelId: string,
    @Param('itemId') itemId: string
  ) {
    return this.foundItemService.findById(hotelId, itemId);
  }

  /**
   * POST /api/v2/hotels/:hotelId/found-items
   * Créer un nouvel objet trouvé
   */
  @Post()
  async create(
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateFoundItemDto,
    @Query('daysUntilConsign') daysUntilConsign?: number
  ) {
    return this.foundItemService.create(hotelId, dto, daysUntilConsign || 30);
  }

  /**
   * PUT /api/v2/hotels/:hotelId/found-items/:itemId
   * Mettre à jour un objet trouvé
   */
  @Put(':itemId')
  async update(
    @Param('hotelId') hotelId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateFoundItemDto
  ) {
    return this.foundItemService.update(hotelId, itemId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/found-items/:itemId/return
   * Restituer un objet trouvé
   */
  @Post(':itemId/return')
  async returnItem(
    @Param('hotelId') hotelId: string,
    @Param('itemId') itemId: string,
    @Body() dto: ReturnFoundItemDto
  ) {
    return this.foundItemService.returnItem(hotelId, itemId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/found-items/:itemId/consign
   * Mettre en consigne un objet trouvé
   */
  @Post(':itemId/consign')
  async consignItem(
    @Param('hotelId') hotelId: string,
    @Param('itemId') itemId: string,
    @Body() dto: ConsignFoundItemDto
  ) {
    return this.foundItemService.consignItem(hotelId, itemId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/found-items/auto-consign
   * Auto-consigner les objets dont le délai est dépassé
   */
  @Post('auto-consign')
  async autoConsign(@Param('hotelId') hotelId: string) {
    const count = await this.foundItemService.autoConsign(hotelId);
    return { consigned_count: count };
  }
}
