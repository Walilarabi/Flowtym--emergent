/**
 * Category Schema - Catégories paramétrables pour Signalements et Objets Trouvés
 * Géré par le rôle Direction via Configuration
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

export enum CategoryType {
  REPORT = 'report',        // Signalements
  FOUND_ITEM = 'found_item' // Objets trouvés
}

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, type: String })
  hotel_id: string;

  @Prop({ required: true, enum: CategoryType })
  type: CategoryType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  icon: string; // Nom de l'icône lucide-react (ex: 'Lightbulb', 'Wrench', etc.)

  @Prop({ default: '#6366F1' })
  color: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: false })
  is_default: boolean; // Catégories par défaut non supprimables

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Index composé pour recherche rapide
CategorySchema.index({ hotel_id: 1, type: 1, is_active: 1 });
CategorySchema.index({ hotel_id: 1, type: 1, order: 1 });
