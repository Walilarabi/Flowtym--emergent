/**
 * FoundItem Service - Gestion des objets trouvés
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FoundItem, FoundItemDocument, FoundItemStatus } from '../schemas/found-item.schema';
import { 
  CreateFoundItemDto, 
  UpdateFoundItemDto, 
  ReturnFoundItemDto, 
  ConsignFoundItemDto 
} from '../dto/found-item.dto';

@Injectable()
export class FoundItemService {
  constructor(
    @InjectModel(FoundItem.name) private foundItemModel: Model<FoundItemDocument>,
  ) {}

  /**
   * Créer un nouvel objet trouvé
   */
  async create(hotelId: string, dto: CreateFoundItemDto, daysUntilConsign = 30): Promise<FoundItemDocument> {
    const foundItem = new this.foundItemModel({
      hotel_id: hotelId,
      ...dto,
      category_id: dto.category_id ? new Types.ObjectId(dto.category_id) : undefined,
      status: FoundItemStatus.PENDING,
      days_until_consign: daysUntilConsign,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return foundItem.save();
  }

  /**
   * Récupérer tous les objets trouvés d'un hôtel
   */
  async findAll(hotelId: string, status?: FoundItemStatus): Promise<FoundItemDocument[]> {
    const filter: any = { hotel_id: hotelId };
    if (status) filter.status = status;

    return this.foundItemModel.find(filter).sort({ created_at: -1 }).exec();
  }

  /**
   * Récupérer un objet trouvé par ID
   */
  async findById(hotelId: string, itemId: string): Promise<FoundItemDocument> {
    const item = await this.foundItemModel.findOne({ 
      _id: itemId, 
      hotel_id: hotelId 
    }).exec();

    if (!item) {
      throw new NotFoundException('Objet trouvé non trouvé');
    }

    return item;
  }

  /**
   * Récupérer les statistiques
   */
  async getStats(hotelId: string): Promise<{ pending: number; consigned: number; returned: number }> {
    const [pending, consigned, returned] = await Promise.all([
      this.foundItemModel.countDocuments({ hotel_id: hotelId, status: FoundItemStatus.PENDING }),
      this.foundItemModel.countDocuments({ hotel_id: hotelId, status: FoundItemStatus.CONSIGNED }),
      this.foundItemModel.countDocuments({ hotel_id: hotelId, status: FoundItemStatus.RETURNED }),
    ]);

    return { pending, consigned, returned };
  }

  /**
   * Récupérer les objets groupés par date avec jours restants
   */
  async findGroupedByDate(hotelId: string): Promise<any[]> {
    const items = await this.foundItemModel
      .find({ hotel_id: hotelId })
      .sort({ created_at: -1 })
      .exec();

    // Calculer les jours restants pour chaque objet
    const now = new Date();
    const itemsWithDaysRemaining = items.map(item => {
      const createdAt = new Date(item.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, item.days_until_consign - daysSinceCreation);
      
      return {
        ...item.toObject(),
        days_remaining: daysRemaining,
        should_consign: daysRemaining === 0 && item.status === FoundItemStatus.PENDING,
      };
    });

    // Grouper par date
    const grouped: { [key: string]: any[] } = {};
    
    itemsWithDaysRemaining.forEach(item => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return Object.entries(grouped).map(([date, items]) => ({
      date,
      items,
      count: items.length,
      pending: items.filter(i => i.status === FoundItemStatus.PENDING).length,
      consigned: items.filter(i => i.status === FoundItemStatus.CONSIGNED).length,
      returned: items.filter(i => i.status === FoundItemStatus.RETURNED).length,
    }));
  }

  /**
   * Mettre à jour un objet trouvé
   */
  async update(hotelId: string, itemId: string, dto: UpdateFoundItemDto): Promise<FoundItemDocument> {
    const item = await this.foundItemModel.findOneAndUpdate(
      { _id: itemId, hotel_id: hotelId },
      { ...dto, updated_at: new Date() },
      { new: true },
    ).exec();

    if (!item) {
      throw new NotFoundException('Objet trouvé non trouvé');
    }

    return item;
  }

  /**
   * Restituer un objet trouvé
   */
  async returnItem(hotelId: string, itemId: string, dto: ReturnFoundItemDto): Promise<FoundItemDocument> {
    const item = await this.foundItemModel.findOne({ 
      _id: itemId, 
      hotel_id: hotelId,
      status: FoundItemStatus.PENDING 
    }).exec();

    if (!item) {
      throw new NotFoundException('Objet trouvé non trouvé ou déjà traité');
    }

    if (!dto.recipient_name) {
      throw new BadRequestException('Le nom du récupérateur est obligatoire');
    }

    item.status = FoundItemStatus.RETURNED;
    item.recipient_name = dto.recipient_name;
    if (dto.recipient_id_photo_url) {
      item.recipient_id_photo_url = dto.recipient_id_photo_url;
    }
    item.returned_by_id = dto.returned_by_id;
    item.returned_by_name = dto.returned_by_name;
    item.returned_at = new Date();
    item.updated_at = new Date();

    return item.save();
  }

  /**
   * Mettre en consigne un objet trouvé
   */
  async consignItem(hotelId: string, itemId: string, dto: ConsignFoundItemDto): Promise<FoundItemDocument> {
    const item = await this.foundItemModel.findOne({ 
      _id: itemId, 
      hotel_id: hotelId,
      status: FoundItemStatus.PENDING 
    }).exec();

    if (!item) {
      throw new NotFoundException('Objet trouvé non trouvé ou déjà traité');
    }

    item.status = FoundItemStatus.CONSIGNED;
    item.consigned_by_id = dto.consigned_by_id;
    item.consigned_by_name = dto.consigned_by_name;
    item.consign_action = dto.consign_action;
    if (dto.consign_notes) {
      item.consign_notes = dto.consign_notes;
    }
    item.consigned_at = new Date();
    item.updated_at = new Date();

    return item.save();
  }

  /**
   * Rechercher des objets trouvés
   */
  async search(hotelId: string, query: string): Promise<FoundItemDocument[]> {
    return this.foundItemModel
      .find({
        hotel_id: hotelId,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category_name: { $regex: query, $options: 'i' } },
          { room_number: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ created_at: -1 })
      .exec();
  }

  /**
   * Récupérer les objets à consigner (délai dépassé)
   */
  async findItemsToConsign(hotelId: string): Promise<FoundItemDocument[]> {
    const items = await this.foundItemModel
      .find({ 
        hotel_id: hotelId, 
        status: FoundItemStatus.PENDING 
      })
      .exec();

    const now = new Date();
    
    return items.filter(item => {
      const createdAt = new Date(item.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= item.days_until_consign;
    });
  }

  /**
   * Auto-consigner les objets dont le délai est dépassé
   */
  async autoConsign(hotelId: string): Promise<number> {
    const itemsToConsign = await this.findItemsToConsign(hotelId);
    
    for (const item of itemsToConsign) {
      item.status = FoundItemStatus.CONSIGNED;
      item.consign_action = 'kept';
      item.consign_notes = 'Consigné automatiquement (délai dépassé)';
      item.consigned_at = new Date();
      item.updated_at = new Date();
      await item.save();
    }

    return itemsToConsign.length;
  }

  /**
   * Récupérer les objets par chambre
   */
  async findByRoom(hotelId: string, roomNumber: string): Promise<FoundItemDocument[]> {
    return this.foundItemModel
      .find({ hotel_id: hotelId, room_number: roomNumber })
      .sort({ created_at: -1 })
      .exec();
  }
}
