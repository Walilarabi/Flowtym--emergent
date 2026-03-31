import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InspectionDocument = Inspection & Document;

export enum InspectionResult {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  REFUSE = 'refuse',
}

@Schema({ timestamps: true, collection: 'hk_inspections' })
export class Inspection {
  @Prop({ type: String, required: true, index: true })
  hotel_id: string;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  room_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop()
  room_type: string;

  @Prop({ type: Number })
  floor: number;

  @Prop({ type: Types.ObjectId, ref: 'HousekeepingTask' })
  cleaning_task_id: Types.ObjectId;

  @Prop({ required: true })
  cleaned_by: string;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  inspected_by: Types.ObjectId;

  @Prop()
  inspected_by_name: string;

  @Prop({ type: Date, required: true, default: Date.now })
  inspection_date: Date;

  @Prop({ type: Date, required: true })
  completed_at: Date;

  @Prop({ type: String, enum: InspectionResult, default: InspectionResult.EN_ATTENTE })
  status: InspectionResult;

  @Prop({ type: Object, default: {} })
  checklist: Record<string, { checked: boolean; notes: string }>;

  @Prop({ type: Number, min: 0, max: 100 })
  score: number;

  @Prop({ type: Number, min: 1, max: 5 })
  rating: number;

  @Prop()
  comments: string;

  @Prop()
  refused_reason: string;

  @Prop({ type: [String], default: [] })
  photos: string[];
}

export const InspectionSchema = SchemaFactory.createForClass(Inspection);

InspectionSchema.index({ hotel_id: 1, status: 1 });
InspectionSchema.index({ hotel_id: 1, inspection_date: 1 });
