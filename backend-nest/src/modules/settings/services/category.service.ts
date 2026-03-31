/**
 * Category Service - Gestion des catégories paramétrables
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument, CategoryType } from '../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

// Catégories par défaut pour les signalements
const DEFAULT_REPORT_CATEGORIES = [
  { name: 'WC bouché', icon: 'Droplets', color: '#3B82F6' },
  { name: 'Ampoule grillée', icon: 'Lightbulb', color: '#F59E0B' },
  { name: 'Clim en panne', icon: 'Wind', color: '#06B6D4' },
  { name: 'Serrure cassée', icon: 'Lock', color: '#EF4444' },
  { name: 'Fuite robinet', icon: 'Droplet', color: '#3B82F6' },
  { name: 'Mobilier abîmé', icon: 'Armchair', color: '#8B5CF6' },
  { name: 'TV ne marche pas', icon: 'Tv', color: '#6366F1' },
  { name: 'Autre problème', icon: 'AlertTriangle', color: '#64748B' },
];

// Catégories par défaut pour les objets trouvés
const DEFAULT_FOUND_ITEM_CATEGORIES = [
  { name: 'Téléphone', icon: 'Smartphone', color: '#3B82F6' },
  { name: 'PC portable', icon: 'Laptop', color: '#6366F1' },
  { name: 'Clés', icon: 'Key', color: '#F59E0B' },
  { name: 'Vêtement', icon: 'Shirt', color: '#EC4899' },
  { name: 'Sac', icon: 'Briefcase', color: '#8B5CF6' },
  { name: 'Chaussures', icon: 'Footprints', color: '#64748B' },
  { name: 'Bijoux', icon: 'Gem', color: '#F59E0B' },
  { name: 'Argent', icon: 'Banknote', color: '#22C55E' },
  { name: 'Autre', icon: 'Package', color: '#64748B' },
];

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * Initialiser les catégories par défaut pour un hôtel
   */
  async initializeDefaultCategories(hotelId: string): Promise<void> {
    // Vérifier si les catégories existent déjà
    const existingCount = await this.categoryModel.countDocuments({ hotel_id: hotelId });
    if (existingCount > 0) return;

    // Créer les catégories de signalement
    const reportCategories = DEFAULT_REPORT_CATEGORIES.map((cat, index) => ({
      hotel_id: hotelId,
      type: CategoryType.REPORT,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      is_active: true,
      is_default: true,
      order: index,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // Créer les catégories d'objets trouvés
    const foundItemCategories = DEFAULT_FOUND_ITEM_CATEGORIES.map((cat, index) => ({
      hotel_id: hotelId,
      type: CategoryType.FOUND_ITEM,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      is_active: true,
      is_default: true,
      order: index,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await this.categoryModel.insertMany([...reportCategories, ...foundItemCategories]);
  }

  /**
   * Récupérer toutes les catégories d'un type pour un hôtel
   */
  async findByType(hotelId: string, type: CategoryType, activeOnly = true): Promise<CategoryDocument[]> {
    // Initialiser les catégories si nécessaire
    await this.initializeDefaultCategories(hotelId);

    const filter: any = { hotel_id: hotelId, type };
    if (activeOnly) filter.is_active = true;

    return this.categoryModel.find(filter).sort({ order: 1 }).exec();
  }

  /**
   * Récupérer toutes les catégories d'un hôtel
   */
  async findAll(hotelId: string): Promise<CategoryDocument[]> {
    await this.initializeDefaultCategories(hotelId);
    return this.categoryModel.find({ hotel_id: hotelId }).sort({ type: 1, order: 1 }).exec();
  }

  /**
   * Créer une nouvelle catégorie
   */
  async create(hotelId: string, dto: CreateCategoryDto): Promise<CategoryDocument> {
    // Trouver l'ordre max actuel
    const maxOrder = await this.categoryModel
      .findOne({ hotel_id: hotelId, type: dto.type })
      .sort({ order: -1 })
      .select('order')
      .exec();

    const category = new this.categoryModel({
      hotel_id: hotelId,
      ...dto,
      order: dto.order ?? (maxOrder?.order ?? 0) + 1,
      is_default: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return category.save();
  }

  /**
   * Mettre à jour une catégorie
   */
  async update(hotelId: string, categoryId: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOneAndUpdate(
      { _id: categoryId, hotel_id: hotelId },
      { ...dto, updated_at: new Date() },
      { new: true },
    ).exec();

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    return category;
  }

  /**
   * Supprimer une catégorie (soft delete - désactive seulement)
   */
  async delete(hotelId: string, categoryId: string): Promise<void> {
    const category = await this.categoryModel.findOne({ 
      _id: categoryId, 
      hotel_id: hotelId 
    }).exec();

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    if (category.is_default) {
      throw new BadRequestException('Les catégories par défaut ne peuvent pas être supprimées');
    }

    await this.categoryModel.updateOne(
      { _id: categoryId },
      { is_active: false, updated_at: new Date() },
    ).exec();
  }

  /**
   * Réordonner les catégories
   */
  async reorder(hotelId: string, type: CategoryType, categoryIds: string[]): Promise<void> {
    const bulkOps = categoryIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, hotel_id: hotelId, type },
        update: { order: index, updated_at: new Date() },
      },
    }));

    await this.categoryModel.bulkWrite(bulkOps);
  }
}
