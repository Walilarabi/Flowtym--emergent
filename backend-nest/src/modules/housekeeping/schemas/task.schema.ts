import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HousekeepingTaskDocument = HousekeepingTask & Document;

export enum TaskType {
  DEPART = 'depart',
  RECOUCHE = 'recouche',
  EN_COURS_SEJOUR = 'en_cours_sejour',
  GRANDE_FOUILLE = 'grande_fouille',
  MISE_EN_BLANC = 'mise_en_blanc',
  CONTROLE_RAPIDE = 'controle_rapide',
}

export enum TaskStatus {
  A_FAIRE = 'a_faire',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  INSPECTE = 'inspecte',
  A_REFAIRE = 'a_refaire',
  NON_REQUIS = 'non_requis',
}

@Schema({ timestamps: true, collection: 'hk_tasks' })
export class HousekeepingTask {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  room_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop({ type: String, enum: TaskType, required: true })
  task_type: TaskType;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.A_FAIRE })
  status: TaskStatus;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assigned_to: Types.ObjectId;

  @Prop()
  assigned_to_name: string;

  @Prop({ type: Date, required: true, default: Date.now })
  cleaning_date: Date;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date })
  started_at: Date;

  @Prop({ type: Date })
  completed_at: Date;

  @Prop({ type: Number })
  duration_min: number;

  @Prop({ type: [Object], default: [] })
  products_used: { product_id: string; quantity: number }[];

  @Prop()
  notes: string;

  @Prop({ type: [String], default: [] })
  photos_before: string[];

  @Prop({ type: [String], default: [] })
  photos_after: string[];

  @Prop({ type: Object, default: {} })
  checklist: Record<string, boolean>;

  @Prop({ type: Number })
  floor: number;

  @Prop()
  room_type: string;

  @Prop()
  client_badge: string;
}

export const HousekeepingTaskSchema = SchemaFactory.createForClass(HousekeepingTask);

HousekeepingTaskSchema.index({ hotel_id: 1, cleaning_date: 1 });
HousekeepingTaskSchema.index({ hotel_id: 1, status: 1 });
HousekeepingTaskSchema.index({ assigned_to: 1, status: 1 });
