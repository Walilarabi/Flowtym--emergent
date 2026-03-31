/**
 * Report Schema - Signalements de problèmes
 * Créés par les femmes de chambre, gérés par la maintenance
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportStatus {
  PENDING = 'en_attente',
  IN_PROGRESS = 'en_cours',
  RESOLVED = 'resolu'
}

export enum ReportPriority {
  LOW = 'basse',
  MEDIUM = 'moyenne',
  HIGH = 'haute',
  URGENT = 'urgente'
}

@Schema({ timestamps: true, collection: 'reports' })
export class Report {
  @Prop({ required: true, type: String })
  hotel_id: string;

  @Prop({ required: true })
  room_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  category_name: string; // Stocké pour référence rapide

  @Prop()
  category_icon: string;

  @Prop()
  description: string;

  @Prop()
  photo_url: string;

  @Prop({ required: true })
  reporter_id: string; // ID de la femme de chambre

  @Prop({ required: true })
  reporter_name: string;

  @Prop({ 
    type: String, 
    enum: ReportStatus, 
    default: ReportStatus.PENDING 
  })
  status: ReportStatus;

  @Prop({ 
    type: String, 
    enum: ReportPriority, 
    default: ReportPriority.MEDIUM 
  })
  priority: ReportPriority;

  @Prop()
  technician_id: string; // ID du technicien qui prend en charge

  @Prop()
  technician_name: string;

  @Prop()
  taken_at: Date; // Date de prise en charge

  @Prop({ type: [{ 
    author_id: String, 
    author_name: String, 
    content: String, 
    created_at: Date 
  }] })
  comments: {
    author_id: string;
    author_name: string;
    content: string;
    created_at: Date;
  }[];

  @Prop()
  invoice_url: string; // Facture associée

  @Prop()
  invoice_amount: number;

  @Prop()
  resolution_notes: string;

  @Prop()
  resolved_at: Date;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Index pour recherche et filtrage
ReportSchema.index({ hotel_id: 1, status: 1, created_at: -1 });
ReportSchema.index({ hotel_id: 1, room_number: 1 });
ReportSchema.index({ hotel_id: 1, technician_id: 1, status: 1 });
ReportSchema.index({ hotel_id: 1, priority: 1, status: 1 });
