import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

export enum RoomStatus {
  LIBRE = 'libre',
  OCCUPE = 'occupe',
  DEPART = 'depart',
  RECOUCHE = 'recouche',
  HORS_SERVICE = 'hors_service',
}

export enum CleaningStatus {
  NONE = 'none',
  EN_COURS = 'en_cours',
  NETTOYEE = 'nettoyee',
  VALIDEE = 'validee',
  REFUSEE = 'refusee',
}

export enum ClientBadge {
  NORMAL = 'normal',
  VIP = 'vip',
  PRIORITAIRE = 'prioritaire',
}

@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop({ required: true })
  room_type: string;

  @Prop({ default: 'Classique' })
  room_category: string;

  @Prop({ type: Number })
  floor: number;

  @Prop({ type: Number, default: 20 })
  room_size: number;

  @Prop({ type: String, enum: RoomStatus, default: RoomStatus.LIBRE, index: true })
  status: RoomStatus;

  @Prop({ type: String, enum: CleaningStatus, default: CleaningStatus.NONE })
  cleaning_status: CleaningStatus;

  @Prop({ type: String, enum: ClientBadge, default: ClientBadge.NORMAL })
  client_badge: ClientBadge;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assigned_to: Types.ObjectId;

  @Prop()
  cleaning_assignee: string;

  @Prop({ type: Date })
  cleaning_started_at: Date;

  @Prop({ default: false })
  breakfast_included: boolean;

  @Prop()
  eta_arrival: string;

  @Prop()
  view_type: string;

  @Prop()
  bathroom_type: string;

  @Prop()
  booking_source: string;

  @Prop()
  cleanliness_status: string;

  @Prop()
  vip_instructions: string;

  @Prop({ type: Object })
  current_reservation: {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    pms_reservation_id: string;
    preferences: string;
    status: string;
  };

  @Prop({ type: Number, default: 2 })
  capacity: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: Object, default: {} })
  dotation: Record<string, number>;

  @Prop({ default: true })
  is_active: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ hotel_id: 1, floor: 1 });
RoomSchema.index({ hotel_id: 1, status: 1, cleaning_status: 1 });
RoomSchema.index({ hotel_id: 1, assigned_to: 1 });
