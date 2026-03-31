import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument, RoomStatus, CleaningStatus, ClientBadge } from '../schemas/room.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  async findAllByHotel(hotelId: string): Promise<Room[]> {
    if (!hotelId) {
      return [];
    }
    return this.roomModel
      .find({ hotel_id: hotelId })
      .sort({ floor: 1, room_number: 1 })
      .lean()
      .exec();
  }

  async findByFloor(hotelId: string, floor: number): Promise<Room[]> {
    if (!hotelId) {
      return [];
    }
    return this.roomModel
      .find({ hotel_id: hotelId, floor })
      .sort({ room_number: 1 })
      .lean()
      .exec();
  }

  async findById(id: string): Promise<Room | null> {
    return this.roomModel.findById(id).lean().exec();
  }

  async updateStatus(roomId: string, status: RoomStatus): Promise<Room | null> {
    return this.roomModel
      .findByIdAndUpdate(roomId, { status }, { new: true })
      .lean()
      .exec();
  }

  async updateCleaningStatus(
    roomId: string,
    cleaningStatus: CleaningStatus,
    assignee?: string,
    startedAt?: Date,
  ): Promise<Room | null> {
    const update: any = { cleaning_status: cleaningStatus };
    if (assignee) update.cleaning_assignee = assignee;
    if (startedAt) update.cleaning_started_at = startedAt;

    return this.roomModel
      .findByIdAndUpdate(roomId, update, { new: true })
      .lean()
      .exec();
  }

  async assignRoom(
    roomId: string,
    staffId: string,
    staffName: string,
  ): Promise<Room | null> {
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          assigned_to: new Types.ObjectId(staffId),
          cleaning_assignee: staffName,
        },
        { new: true },
      )
      .lean()
      .exec();
  }

  async getStatsByHotel(hotelId: string): Promise<any> {
    // Validate hotelId exists
    if (!hotelId) {
      return {
        total: 0,
        libre: 0,
        occupe: 0,
        depart: 0,
        recouche: 0,
        hors_service: 0,
        cleaning_none: 0,
        cleaning_en_cours: 0,
        cleaning_nettoyee: 0,
        cleaning_validee: 0,
        cleaning_refusee: 0,
      };
    }
    
    const pipeline = [
      { $match: { hotel_id: hotelId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          libre: { $sum: { $cond: [{ $eq: ['$status', 'libre'] }, 1, 0] } },
          occupe: { $sum: { $cond: [{ $eq: ['$status', 'occupe'] }, 1, 0] } },
          depart: { $sum: { $cond: [{ $eq: ['$status', 'depart'] }, 1, 0] } },
          recouche: { $sum: { $cond: [{ $eq: ['$status', 'recouche'] }, 1, 0] } },
          hors_service: { $sum: { $cond: [{ $eq: ['$status', 'hors_service'] }, 1, 0] } },
          cleaning_none: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'none'] }, 1, 0] } },
          cleaning_en_cours: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'en_cours'] }, 1, 0] } },
          cleaning_nettoyee: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'nettoyee'] }, 1, 0] } },
          cleaning_validee: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'validee'] }, 1, 0] } },
          cleaning_refusee: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'refusee'] }, 1, 0] } },
        },
      },
    ];

    const result = await this.roomModel.aggregate(pipeline).exec();
    return result[0] || {
      total: 0,
      libre: 0,
      occupe: 0,
      depart: 0,
      recouche: 0,
      hors_service: 0,
    };
  }

  // Seed demo data
  async seedDemoRooms(hotelId: string): Promise<number> {
    const existingCount = await this.roomModel.countDocuments({
      hotel_id: hotelId,
    });

    if (existingCount > 0) return existingCount;

    const roomTypes = ['Single', 'Double', 'Twin', 'Suite', 'Suite Junior'];
    const viewTypes = ['Rue', 'Cour', 'Jardin', 'Mer'];
    const bathroomTypes = ['Douche', 'Baignoire', 'Douche + Baignoire'];
    const sources = ['Direct', 'Booking.com', 'Expedia', 'Airbnb', 'Walk-in'];
    const statuses = [RoomStatus.LIBRE, RoomStatus.OCCUPE, RoomStatus.DEPART, RoomStatus.RECOUCHE];
    const cleaningStatuses = [CleaningStatus.NONE, CleaningStatus.NETTOYEE, CleaningStatus.VALIDEE];

    const rooms: Partial<Room>[] = [];
    const floors = [1, 2, 3, 4];

    for (const floor of floors) {
      for (let i = 1; i <= 10; i++) {
        const roomNumber = `${floor}${i.toString().padStart(2, '0')}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const hasReservation = status !== RoomStatus.LIBRE;

        rooms.push({
          hotel_id: hotelId as any,
          room_number: roomNumber,
          room_type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
          room_category: Math.random() > 0.7 ? 'Premium' : 'Classique',
          floor,
          room_size: 18 + Math.floor(Math.random() * 30),
          status,
          cleaning_status: cleaningStatuses[Math.floor(Math.random() * cleaningStatuses.length)],
          client_badge: Math.random() > 0.9 ? ClientBadge.VIP : Math.random() > 0.8 ? ClientBadge.PRIORITAIRE : ClientBadge.NORMAL,
          breakfast_included: Math.random() > 0.3,
          eta_arrival: hasReservation ? `${14 + Math.floor(Math.random() * 4)}:${Math.random() > 0.5 ? '00' : '30'}` : undefined,
          view_type: viewTypes[Math.floor(Math.random() * viewTypes.length)],
          bathroom_type: bathroomTypes[Math.floor(Math.random() * bathroomTypes.length)],
          booking_source: hasReservation ? sources[Math.floor(Math.random() * sources.length)] : undefined,
          current_reservation: hasReservation
            ? {
                guest_name: ['Martin', 'Dupont', 'Bernard', 'Petit', 'Robert'][Math.floor(Math.random() * 5)],
                check_in_date: new Date().toISOString().split('T')[0],
                check_out_date: new Date(Date.now() + (1 + Math.floor(Math.random() * 5)) * 86400000).toISOString().split('T')[0],
                adults: 1 + Math.floor(Math.random() * 2),
                children: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
                pms_reservation_id: `RES${Date.now()}${i}`,
                preferences: '',
                status: 'confirmed',
              }
            : undefined,
          capacity: 2 + Math.floor(Math.random() * 2),
          amenities: ['WiFi', 'TV', 'Minibar', 'Coffre'].slice(0, 2 + Math.floor(Math.random() * 3)),
          is_active: true,
        });
      }
    }

    await this.roomModel.insertMany(rooms);
    return rooms.length;
  }
}
