/**
 * Report Service - Gestion des signalements
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument, ReportStatus } from '../schemas/report.schema';
import { 
  CreateReportDto, 
  UpdateReportDto, 
  TakeOverReportDto, 
  AddCommentDto, 
  AddInvoiceDto,
  ResolveReportDto 
} from '../dto/report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  /**
   * Créer un nouveau signalement
   */
  async create(hotelId: string, dto: CreateReportDto): Promise<ReportDocument> {
    const report = new this.reportModel({
      hotel_id: hotelId,
      ...dto,
      category_id: dto.category_id ? new Types.ObjectId(dto.category_id) : undefined,
      status: ReportStatus.PENDING,
      comments: [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    return report.save();
  }

  /**
   * Récupérer tous les signalements d'un hôtel
   */
  async findAll(hotelId: string, status?: ReportStatus): Promise<ReportDocument[]> {
    const filter: any = { hotel_id: hotelId };
    if (status) filter.status = status;

    return this.reportModel.find(filter).sort({ created_at: -1 }).exec();
  }

  /**
   * Récupérer un signalement par ID
   */
  async findById(hotelId: string, reportId: string): Promise<ReportDocument> {
    const report = await this.reportModel.findOne({ 
      _id: reportId, 
      hotel_id: hotelId 
    }).exec();

    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    return report;
  }

  /**
   * Récupérer les statistiques
   */
  async getStats(hotelId: string): Promise<{ pending: number; in_progress: number; resolved: number }> {
    const [pending, inProgress, resolved] = await Promise.all([
      this.reportModel.countDocuments({ hotel_id: hotelId, status: ReportStatus.PENDING }),
      this.reportModel.countDocuments({ hotel_id: hotelId, status: ReportStatus.IN_PROGRESS }),
      this.reportModel.countDocuments({ hotel_id: hotelId, status: ReportStatus.RESOLVED }),
    ]);

    return { pending, in_progress: inProgress, resolved };
  }

  /**
   * Récupérer les signalements groupés par date
   */
  async findGroupedByDate(hotelId: string): Promise<any[]> {
    const reports = await this.reportModel
      .find({ hotel_id: hotelId })
      .sort({ created_at: -1 })
      .exec();

    // Grouper par date
    const grouped: { [key: string]: ReportDocument[] } = {};
    
    reports.forEach(report => {
      const dateKey = report.created_at.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(report);
    });

    return Object.entries(grouped).map(([date, items]) => ({
      date,
      reports: items,
      count: items.length,
      pending: items.filter(r => r.status === ReportStatus.PENDING).length,
      in_progress: items.filter(r => r.status === ReportStatus.IN_PROGRESS).length,
      resolved: items.filter(r => r.status === ReportStatus.RESOLVED).length,
    }));
  }

  /**
   * Mettre à jour un signalement
   */
  async update(hotelId: string, reportId: string, dto: UpdateReportDto): Promise<ReportDocument> {
    const report = await this.reportModel.findOneAndUpdate(
      { _id: reportId, hotel_id: hotelId },
      { ...dto, updated_at: new Date() },
      { new: true },
    ).exec();

    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    return report;
  }

  /**
   * Prendre en charge un signalement
   */
  async takeOver(hotelId: string, reportId: string, dto: TakeOverReportDto): Promise<ReportDocument> {
    const report = await this.reportModel.findOneAndUpdate(
      { _id: reportId, hotel_id: hotelId, status: ReportStatus.PENDING },
      { 
        status: ReportStatus.IN_PROGRESS,
        technician_id: dto.technician_id,
        technician_name: dto.technician_name,
        taken_at: new Date(),
        updated_at: new Date(),
      },
      { new: true },
    ).exec();

    if (!report) {
      throw new NotFoundException('Signalement non trouvé ou déjà pris en charge');
    }

    return report;
  }

  /**
   * Ajouter un commentaire
   */
  async addComment(hotelId: string, reportId: string, dto: AddCommentDto): Promise<ReportDocument> {
    const report = await this.reportModel.findOneAndUpdate(
      { _id: reportId, hotel_id: hotelId },
      { 
        $push: { 
          comments: { 
            ...dto, 
            created_at: new Date() 
          } 
        },
        updated_at: new Date(),
      },
      { new: true },
    ).exec();

    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    return report;
  }

  /**
   * Ajouter une facture
   */
  async addInvoice(hotelId: string, reportId: string, dto: AddInvoiceDto): Promise<ReportDocument> {
    const report = await this.reportModel.findOneAndUpdate(
      { _id: reportId, hotel_id: hotelId },
      { 
        invoice_url: dto.invoice_url,
        invoice_amount: dto.invoice_amount,
        updated_at: new Date(),
      },
      { new: true },
    ).exec();

    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    return report;
  }

  /**
   * Résoudre un signalement
   */
  async resolve(hotelId: string, reportId: string, dto: ResolveReportDto): Promise<ReportDocument> {
    const report = await this.reportModel.findOneAndUpdate(
      { _id: reportId, hotel_id: hotelId, status: { $ne: ReportStatus.RESOLVED } },
      { 
        status: ReportStatus.RESOLVED,
        resolution_notes: dto.resolution_notes,
        resolved_at: new Date(),
        updated_at: new Date(),
      },
      { new: true },
    ).exec();

    if (!report) {
      throw new NotFoundException('Signalement non trouvé ou déjà résolu');
    }

    return report;
  }

  /**
   * Récupérer les signalements par chambre
   */
  async findByRoom(hotelId: string, roomNumber: string): Promise<ReportDocument[]> {
    return this.reportModel
      .find({ hotel_id: hotelId, room_number: roomNumber })
      .sort({ created_at: -1 })
      .exec();
  }

  /**
   * Récupérer les signalements d'un technicien
   */
  async findByTechnician(hotelId: string, technicianId: string): Promise<ReportDocument[]> {
    return this.reportModel
      .find({ hotel_id: hotelId, technician_id: technicianId })
      .sort({ created_at: -1 })
      .exec();
  }
}
