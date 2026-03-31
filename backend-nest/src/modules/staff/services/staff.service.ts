import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff, StaffDocument, StaffRole } from '../schemas/staff.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
  ) {}

  async findAllByHotel(hotelId: string, role?: StaffRole): Promise<Staff[]> {
    if (!hotelId) {
      return [];
    }
    const filter: any = { hotel_id: hotelId, active: true };
    if (role) filter.role = role;
    
    return this.staffModel.find(filter).sort({ last_name: 1 }).lean().exec();
  }

  async findFemmesDeChambre(hotelId: string): Promise<Staff[]> {
    return this.findAllByHotel(hotelId, StaffRole.FEMME_DE_CHAMBRE);
  }

  async findById(id: string): Promise<Staff | null> {
    return this.staffModel.findById(id).lean().exec();
  }

  async updateLoad(staffId: string, increment: number): Promise<Staff | null> {
    return this.staffModel
      .findByIdAndUpdate(
        staffId,
        { $inc: { current_load: increment } },
        { new: true },
      )
      .lean()
      .exec();
  }

  async incrementCompletedToday(staffId: string): Promise<Staff | null> {
    return this.staffModel
      .findByIdAndUpdate(
        staffId,
        { $inc: { completed_today: 1, current_load: -1 } },
        { new: true },
      )
      .lean()
      .exec();
  }

  async resetDailyStats(hotelId: string): Promise<void> {
    await this.staffModel.updateMany(
      { hotel_id: hotelId },
      { $set: { current_load: 0, completed_today: 0 } },
    );
  }

  async seedDemoStaff(hotelId: string): Promise<number> {
    const existingCount = await this.staffModel.countDocuments({
      hotel_id: hotelId,
    });

    if (existingCount > 0) return existingCount;

    const staff: Partial<Staff>[] = [
      // Femmes de chambre
      { first_name: 'Marie', last_name: 'Dupont', role: StaffRole.FEMME_DE_CHAMBRE, max_load: 12, current_load: 4, completed_today: 3, shift_start: '07:00', shift_end: '15:00', preferred_floors: [1, 2] },
      { first_name: 'Sophie', last_name: 'Martin', role: StaffRole.FEMME_DE_CHAMBRE, max_load: 12, current_load: 6, completed_today: 2, shift_start: '07:00', shift_end: '15:00', preferred_floors: [2, 3] },
      { first_name: 'Fatima', last_name: 'Benali', role: StaffRole.FEMME_DE_CHAMBRE, max_load: 10, current_load: 3, completed_today: 4, shift_start: '08:00', shift_end: '16:00', preferred_floors: [3, 4] },
      { first_name: 'Anna', last_name: 'Kowalski', role: StaffRole.FEMME_DE_CHAMBRE, max_load: 12, current_load: 5, completed_today: 1, shift_start: '07:00', shift_end: '15:00', preferred_floors: [1, 4] },
      // Gouvernante
      { first_name: 'Claire', last_name: 'Bernard', role: StaffRole.GOUVERNANTE, max_load: 0, current_load: 0, shift_start: '06:30', shift_end: '15:30' },
      // Maintenance
      { first_name: 'Jean', last_name: 'Moreau', role: StaffRole.MAINTENANCE, max_load: 8, current_load: 2, shift_start: '08:00', shift_end: '17:00' },
      { first_name: 'Pierre', last_name: 'Leroy', role: StaffRole.MAINTENANCE, max_load: 8, current_load: 1, shift_start: '14:00', shift_end: '22:00' },
      // Breakfast
      { first_name: 'Lucie', last_name: 'Petit', role: StaffRole.BREAKFAST_STAFF, shift_start: '05:30', shift_end: '11:00' },
      { first_name: 'Marc', last_name: 'Dubois', role: StaffRole.BREAKFAST_STAFF, shift_start: '05:30', shift_end: '11:00' },
    ];

    const docsToInsert = staff.map((s) => ({
      ...s,
      hotel_id: hotelId,
      active: true,
    }));

    await this.staffModel.insertMany(docsToInsert);
    return docsToInsert.length;
  }
}
