import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffDocument = Staff & Document;

export enum StaffRole {
  DIRECTION = 'direction',
  GOUVERNANTE = 'gouvernante',
  RECEPTION = 'reception',
  FEMME_DE_CHAMBRE = 'femme_de_chambre',
  MAINTENANCE = 'maintenance',
  BREAKFAST_STAFF = 'breakfast_staff',
  ECONOMAT = 'economat',
}

@Schema({ timestamps: true, collection: 'hk_staff' })
export class Staff {
  @Prop({ type: String, required: true, index: true })
  hotel_id: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ type: String, enum: StaffRole, required: true })
  role: StaffRole;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Number, default: 12 })
  max_load: number;

  @Prop({ type: Number, default: 0 })
  current_load: number;

  @Prop({ type: Number, default: 0 })
  completed_today: number;

  @Prop()
  current_zone: string;

  @Prop({ type: [Number], default: [] })
  preferred_floors: number[];

  @Prop()
  shift_start: string;

  @Prop()
  shift_end: string;

  @Prop()
  avatar_url: string;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

StaffSchema.index({ hotel_id: 1, role: 1 });
StaffSchema.index({ hotel_id: 1, active: 1 });
