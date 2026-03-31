/**
 * FoundItem Schema - Objets trouvés
 * Déclarés par les femmes de chambre, gérés par la réception
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FoundItemDocument = FoundItem & Document;

export enum FoundItemStatus {
  PENDING = 'en_attente',
  CONSIGNED = 'consigne',
  RETURNED = 'restitue'
}

@Schema({ timestamps: true, collection: 'found_items' })
export class FoundItem {
  @Prop({ required: true, type: String })
  hotel_id: string;

  @Prop({ required: true })
  room_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  category_name: string;

  @Prop()
  category_icon: string;

  @Prop()
  name: string; // Nom spécifique de l'objet (ex: "Montre dorée")

  @Prop()
  description: string;

  @Prop()
  location_found: string; // Ex: "sur la table de nuit"

  @Prop()
  photo_url: string;

  @Prop({ required: true })
  reporter_id: string;

  @Prop({ required: true })
  reporter_name: string;

  @Prop({ 
    type: String, 
    enum: FoundItemStatus, 
    default: FoundItemStatus.PENDING 
  })
  status: FoundItemStatus;

  // Informations de restitution
  @Prop()
  recipient_name: string;

  @Prop()
  recipient_id_photo_url: string; // Photo de la pièce d'identité

  @Prop()
  returned_at: Date;

  @Prop()
  returned_by_id: string; // ID de l'employé qui a fait la restitution

  @Prop()
  returned_by_name: string;

  // Informations de consigne
  @Prop()
  consigned_at: Date;

  @Prop()
  consigned_by_id: string;

  @Prop()
  consigned_by_name: string;

  @Prop()
  consign_action: string; // 'kept', 'destroyed', 'donated'

  @Prop()
  consign_notes: string;

  // Délai configurable (hérité de la config hôtel)
  @Prop({ default: 30 })
  days_until_consign: number;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const FoundItemSchema = SchemaFactory.createForClass(FoundItem);

// Index pour recherche et filtrage
FoundItemSchema.index({ hotel_id: 1, status: 1, created_at: -1 });
FoundItemSchema.index({ hotel_id: 1, room_number: 1 });
FoundItemSchema.index({ hotel_id: 1, category_name: 1 });
FoundItemSchema.index({ name: 'text', description: 'text' }); // Recherche textuelle
