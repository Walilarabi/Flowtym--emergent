/**
 * Report Controller - API pour les signalements
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
import { ReportService } from '../services/report.service';
import { 
  CreateReportDto, 
  UpdateReportDto, 
  TakeOverReportDto, 
  AddCommentDto, 
  AddInvoiceDto,
  ResolveReportDto 
} from '../dto/report.dto';
import { ReportStatus } from '../schemas/report.schema';

@Controller('hotels/:hotelId/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * GET /api/v2/hotels/:hotelId/reports
   * Récupérer tous les signalements
   */
  @Get()
  async findAll(
    @Param('hotelId') hotelId: string,
    @Query('status') status?: ReportStatus
  ) {
    return this.reportService.findAll(hotelId, status);
  }

  /**
   * GET /api/v2/hotels/:hotelId/reports/stats
   * Récupérer les statistiques
   */
  @Get('stats')
  async getStats(@Param('hotelId') hotelId: string) {
    return this.reportService.getStats(hotelId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/reports/grouped
   * Récupérer les signalements groupés par date
   */
  @Get('grouped')
  async findGroupedByDate(@Param('hotelId') hotelId: string) {
    return this.reportService.findGroupedByDate(hotelId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/reports/room/:roomNumber
   * Récupérer les signalements d'une chambre
   */
  @Get('room/:roomNumber')
  async findByRoom(
    @Param('hotelId') hotelId: string,
    @Param('roomNumber') roomNumber: string
  ) {
    return this.reportService.findByRoom(hotelId, roomNumber);
  }

  /**
   * GET /api/v2/hotels/:hotelId/reports/technician/:technicianId
   * Récupérer les signalements d'un technicien
   */
  @Get('technician/:technicianId')
  async findByTechnician(
    @Param('hotelId') hotelId: string,
    @Param('technicianId') technicianId: string
  ) {
    return this.reportService.findByTechnician(hotelId, technicianId);
  }

  /**
   * GET /api/v2/hotels/:hotelId/reports/:reportId
   * Récupérer un signalement par ID
   */
  @Get(':reportId')
  async findById(
    @Param('hotelId') hotelId: string,
    @Param('reportId') reportId: string
  ) {
    return this.reportService.findById(hotelId, reportId);
  }

  /**
   * POST /api/v2/hotels/:hotelId/reports
   * Créer un nouveau signalement
   */
  @Post()
  async create(
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateReportDto
  ) {
    return this.reportService.create(hotelId, dto);
  }

  /**
   * PUT /api/v2/hotels/:hotelId/reports/:reportId
   * Mettre à jour un signalement
   */
  @Put(':reportId')
  async update(
    @Param('hotelId') hotelId: string,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateReportDto
  ) {
    return this.reportService.update(hotelId, reportId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/reports/:reportId/take-over
   * Prendre en charge un signalement
   */
  @Post(':reportId/take-over')
  async takeOver(
    @Param('hotelId') hotelId: string,
    @Param('reportId') reportId: string,
    @Body() dto: TakeOverReportDto
  ) {
    return this.reportService.takeOver(hotelId, reportId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/reports/:reportId/comment
   * Ajouter un commentaire
   */
  @Post(':reportId/comment')
  async addComment(
    @Param('hotelId') hotelId: string,
    @Param('reportId') reportId: string,
    @Body() dto: AddCommentDto
  ) {
    return this.reportService.addComment(hotelId, reportId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/reports/:reportId/invoice
   * Ajouter une facture
   */
  @Post(':reportId/invoice')
  async addInvoice(
    @Param('hotelId') hotelId: string,
    @Param('reportId') reportId: string,
    @Body() dto: AddInvoiceDto
  ) {
    return this.reportService.addInvoice(hotelId, reportId, dto);
  }

  /**
   * POST /api/v2/hotels/:hotelId/reports/:reportId/resolve
   * Résoudre un signalement
   */
  @Post(':reportId/resolve')
  async resolve(
    @Param('hotelId') hotelId: string,
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto
  ) {
    return this.reportService.resolve(hotelId, reportId, dto);
  }
}
