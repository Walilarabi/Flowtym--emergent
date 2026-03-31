import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HousekeepingTask, HousekeepingTaskDocument, TaskStatus, TaskType } from '../schemas/task.schema';
import { Inspection, InspectionDocument, InspectionResult } from '../schemas/inspection.schema';
import { HousekeepingGateway } from '../gateways/housekeeping.gateway';
import { RoomsService } from '../../rooms/services/rooms.service';
import { StaffService } from '../../staff/services/staff.service';
import { CleaningStatus } from '../../rooms/schemas/room.schema';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectModel(HousekeepingTask.name) private taskModel: Model<HousekeepingTaskDocument>,
    @InjectModel(Inspection.name) private inspectionModel: Model<InspectionDocument>,
    private readonly gateway: HousekeepingGateway,
    private readonly roomsService: RoomsService,
    private readonly staffService: StaffService,
  ) {}

  // ==================== TASKS ====================

  async getTasks(hotelId: string, date?: string): Promise<HousekeepingTask[]> {
    if (!hotelId) {
      return [];
    }
    const filter: any = { hotel_id: hotelId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.cleaning_date = { $gte: startOfDay, $lte: endOfDay };
    }

    return this.taskModel
      .find(filter)
      .sort({ priority: -1, floor: 1, room_number: 1 })
      .lean()
      .exec();
  }

  async getTasksByStaff(hotelId: string, staffId: string): Promise<HousekeepingTask[]> {
    if (!hotelId) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.taskModel
      .find({
        hotel_id: hotelId,
        assigned_to: new Types.ObjectId(staffId),
        cleaning_date: { $gte: today },
        status: { $in: [TaskStatus.A_FAIRE, TaskStatus.EN_COURS] },
      })
      .sort({ priority: -1, room_number: 1 })
      .lean()
      .exec();
  }

  async startTask(hotelId: string, taskId: string): Promise<HousekeepingTask | null> {
    const task = await this.taskModel.findByIdAndUpdate(
      taskId,
      {
        status: TaskStatus.EN_COURS,
        started_at: new Date(),
      },
      { new: true },
    ).lean().exec();

    if (task) {
      // Update room cleaning status
      await this.roomsService.updateCleaningStatus(
        task.room_id.toString(),
        CleaningStatus.EN_COURS,
        task.assigned_to_name,
        new Date(),
      );

      // Emit WebSocket update
      this.gateway.emitTaskUpdate({
        hotelId,
        taskId: task._id.toString(),
        roomNumber: task.room_number,
        status: task.status,
        assignedTo: task.assigned_to_name,
      });

      this.gateway.emitRoomUpdate({
        hotelId,
        roomId: task.room_id.toString(),
        roomNumber: task.room_number,
        cleaningStatus: CleaningStatus.EN_COURS,
      });
    }

    return task;
  }

  async completeTask(
    hotelId: string,
    taskId: string,
    photosAfter: string[] = [],
    notes: string = '',
  ): Promise<HousekeepingTask | null> {
    const task = await this.taskModel.findById(taskId).lean().exec();
    if (!task) return null;

    const startedAt = task.started_at || new Date();
    const completedAt = new Date();
    const durationMin = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);

    const updatedTask = await this.taskModel.findByIdAndUpdate(
      taskId,
      {
        status: TaskStatus.TERMINE,
        completed_at: completedAt,
        duration_min: durationMin,
        photos_after: photosAfter,
        notes,
      },
      { new: true },
    ).lean().exec();

    if (updatedTask) {
      // Update room cleaning status
      await this.roomsService.updateCleaningStatus(
        updatedTask.room_id.toString(),
        CleaningStatus.NETTOYEE,
      );

      // Increment staff completed count
      if (updatedTask.assigned_to) {
        await this.staffService.incrementCompletedToday(updatedTask.assigned_to.toString());
      }

      // Create inspection record
      await this.createInspection(hotelId, updatedTask);

      // Emit updates
      this.gateway.emitTaskUpdate({
        hotelId,
        taskId: updatedTask._id.toString(),
        roomNumber: updatedTask.room_number,
        status: updatedTask.status,
      });

      this.gateway.emitRoomUpdate({
        hotelId,
        roomId: updatedTask.room_id.toString(),
        roomNumber: updatedTask.room_number,
        cleaningStatus: CleaningStatus.NETTOYEE,
      });

      this.gateway.emitStatsRefresh(hotelId);
    }

    return updatedTask;
  }

  async assignTasks(
    hotelId: string,
    taskIds: string[],
    staffId: string,
    staffName: string,
  ): Promise<number> {
    const result = await this.taskModel.updateMany(
      {
        _id: { $in: taskIds.map((id) => new Types.ObjectId(id)) },
        hotel_id: hotelId,
      },
      {
        assigned_to: new Types.ObjectId(staffId),
        assigned_to_name: staffName,
      },
    );

    // Update staff load
    await this.staffService.updateLoad(staffId, result.modifiedCount);

    // Emit assignment update
    this.gateway.emitAssignmentUpdate(hotelId, {
      staffId,
      rooms: taskIds,
    });

    return result.modifiedCount;
  }

  // ==================== INSPECTIONS ====================

  async createInspection(hotelId: string, task: any): Promise<Inspection> {
    const inspection = new this.inspectionModel({
      hotel_id: hotelId,
      room_id: task.room_id,
      room_number: task.room_number,
      room_type: task.room_type,
      floor: task.floor,
      cleaning_task_id: task._id,
      cleaned_by: task.assigned_to_name || 'Unknown',
      inspection_date: new Date(),
      completed_at: task.completed_at || new Date(),
      status: InspectionResult.EN_ATTENTE,
    });

    return inspection.save();
  }

  async getInspections(hotelId: string, status?: InspectionResult): Promise<Inspection[]> {
    if (!hotelId) {
      return [];
    }
    const filter: any = { hotel_id: hotelId };
    if (status) filter.status = status;

    return this.inspectionModel
      .find(filter)
      .sort({ inspection_date: -1 })
      .lean()
      .exec();
  }

  async validateInspection(
    hotelId: string,
    inspectionId: string,
    approved: boolean,
    rating: number,
    comments: string,
    refusedReason?: string,
    inspectedByName?: string,
  ): Promise<Inspection | null> {
    const status = approved ? InspectionResult.VALIDE : InspectionResult.REFUSE;
    const cleaningStatus = approved ? CleaningStatus.VALIDEE : CleaningStatus.REFUSEE;

    const inspection = await this.inspectionModel.findByIdAndUpdate(
      inspectionId,
      {
        status,
        rating,
        comments,
        refused_reason: refusedReason,
        inspected_by_name: inspectedByName,
      },
      { new: true },
    ).lean().exec();

    if (inspection) {
      // Update room cleaning status
      await this.roomsService.updateCleaningStatus(
        inspection.room_id.toString(),
        cleaningStatus,
      );

      // If refused, create a new task
      if (!approved) {
        const task = await this.taskModel.findById(inspection.cleaning_task_id).lean().exec();
        if (task) {
          await this.taskModel.findByIdAndUpdate(task._id, {
            status: TaskStatus.A_REFAIRE,
          });
        }
      }

      // Emit updates
      this.gateway.emitInspectionUpdate(hotelId, inspection);
      this.gateway.emitRoomUpdate({
        hotelId,
        roomId: inspection.room_id.toString(),
        roomNumber: inspection.room_number,
        cleaningStatus,
      });

      this.gateway.emitStatsRefresh(hotelId);
    }

    return inspection;
  }

  // ==================== STATS ====================

  async getStats(hotelId: string): Promise<any> {
    if (!hotelId) {
      return {
        rooms: { total: 0, libre: 0, occupe: 0, depart: 0, recouche: 0, hors_service: 0 },
        tasks: { total: 0, a_faire: 0, en_cours: 0, termine: 0, inspecte: 0, departs: 0, recouches: 0 },
        inspections: { total: 0, en_attente: 0, valide: 0, refuse: 0 },
        occupancy_rate: 0,
        cleanliness_rate: 0,
        connected_clients: 0,
      };
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [roomStats, taskStats, inspectionStats] = await Promise.all([
      this.roomsService.getStatsByHotel(hotelId),
      this.taskModel.aggregate([
        {
          $match: {
            hotel_id: hotelId,
            cleaning_date: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            a_faire: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.A_FAIRE] }, 1, 0] } },
            en_cours: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.EN_COURS] }, 1, 0] } },
            termine: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.TERMINE] }, 1, 0] } },
            inspecte: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.INSPECTE] }, 1, 0] } },
            departs: { $sum: { $cond: [{ $eq: ['$task_type', TaskType.DEPART] }, 1, 0] } },
            recouches: { $sum: { $cond: [{ $eq: ['$task_type', TaskType.RECOUCHE] }, 1, 0] } },
          },
        },
      ]).exec(),
      this.inspectionModel.aggregate([
        {
          $match: {
            hotel_id: hotelId,
            inspection_date: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            en_attente: { $sum: { $cond: [{ $eq: ['$status', InspectionResult.EN_ATTENTE] }, 1, 0] } },
            valide: { $sum: { $cond: [{ $eq: ['$status', InspectionResult.VALIDE] }, 1, 0] } },
            refuse: { $sum: { $cond: [{ $eq: ['$status', InspectionResult.REFUSE] }, 1, 0] } },
          },
        },
      ]).exec(),
    ]);

    const tasks = taskStats[0] || { total: 0, a_faire: 0, en_cours: 0, termine: 0, inspecte: 0, departs: 0, recouches: 0 };
    const inspections = inspectionStats[0] || { total: 0, en_attente: 0, valide: 0, refuse: 0 };

    return {
      rooms: roomStats,
      tasks,
      inspections,
      occupancy_rate: roomStats.total > 0 
        ? Math.round(((roomStats.occupe + roomStats.depart + roomStats.recouche) / roomStats.total) * 100) 
        : 0,
      cleanliness_rate: roomStats.total > 0
        ? Math.round((roomStats.cleaning_validee / roomStats.total) * 100)
        : 0,
      connected_clients: this.gateway.getConnectedClientsCount(hotelId),
    };
  }

  // ==================== AUTO ASSIGNMENT ====================

  async autoAssign(hotelId: string, strategy: 'balanced' | 'floor' = 'balanced'): Promise<number> {
    // Get unassigned tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unassignedTasks: any[] = await this.taskModel.find({
      hotel_id: hotelId,
      cleaning_date: { $gte: today },
      assigned_to: { $exists: false },
      status: TaskStatus.A_FAIRE,
    }).lean().exec();

    if (unassignedTasks.length === 0) return 0;

    // Get available staff
    const staff: any[] = await this.staffService.findFemmesDeChambre(hotelId);
    const availableStaff = staff.filter((s) => s.current_load < s.max_load);

    if (availableStaff.length === 0) return 0;

    let assignedCount = 0;

    if (strategy === 'balanced') {
      // Distribute tasks evenly
      for (const task of unassignedTasks) {
        // Find staff with lowest load
        availableStaff.sort((a, b) => a.current_load - b.current_load);
        const assignee = availableStaff.find((s) => s.current_load < s.max_load);

        if (assignee) {
          await this.taskModel.findByIdAndUpdate(task._id, {
            assigned_to: assignee._id,
            assigned_to_name: `${assignee.first_name} ${assignee.last_name}`,
          });
          assignee.current_load++;
          assignedCount++;
        }
      }
    } else {
      // Floor-based assignment
      for (const task of unassignedTasks) {
        const preferredStaff = availableStaff.find(
          (s) => s.preferred_floors?.includes(task.floor) && s.current_load < s.max_load,
        );
        const assignee = preferredStaff || availableStaff.find((s) => s.current_load < s.max_load);

        if (assignee) {
          await this.taskModel.findByIdAndUpdate(task._id, {
            assigned_to: assignee._id,
            assigned_to_name: `${assignee.first_name} ${assignee.last_name}`,
          });
          assignee.current_load++;
          assignedCount++;
        }
      }
    }

    // Update staff loads in DB
    for (const s of availableStaff) {
      await this.staffService.updateLoad(s._id.toString(), 0); // Reset will recalculate
    }

    this.gateway.emitStatsRefresh(hotelId);

    return assignedCount;
  }

  // ==================== SEED DATA ====================

  async seedDemoData(hotelId: string): Promise<any> {
    // First seed rooms and staff
    const roomsCount = await this.roomsService.seedDemoRooms(hotelId);
    const staffCount = await this.staffService.seedDemoStaff(hotelId);

    // Get rooms to create tasks
    const rooms: any[] = await this.roomsService.findAllByHotel(hotelId);
    const staff: any[] = await this.staffService.findFemmesDeChambre(hotelId);

    // Clear existing tasks for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.taskModel.deleteMany({
      hotel_id: hotelId,
      cleaning_date: { $gte: today },
    });

    // Create tasks based on room status
    const tasks: any[] = [];

    for (const room of rooms) {
      if (room.status === 'depart' || room.status === 'recouche') {
        const taskType = room.status === 'depart' ? TaskType.DEPART : TaskType.RECOUCHE;
        const randomStaff = staff[Math.floor(Math.random() * staff.length)];

        tasks.push({
          hotel_id: hotelId,
          room_id: room._id,
          room_number: room.room_number,
          task_type: taskType,
          status: Math.random() > 0.7 ? TaskStatus.EN_COURS : TaskStatus.A_FAIRE,
          assigned_to: randomStaff ? new Types.ObjectId(randomStaff._id.toString()) : undefined,
          assigned_to_name: randomStaff ? `${randomStaff.first_name} ${randomStaff.last_name}` : undefined,
          cleaning_date: today,
          priority: room.client_badge === 'vip' ? 3 : room.client_badge === 'prioritaire' ? 2 : 1,
          floor: room.floor,
          room_type: room.room_type,
          client_badge: room.client_badge,
        });
      }
    }

    if (tasks.length > 0) {
      await this.taskModel.insertMany(tasks);
    }

    return {
      rooms_created: roomsCount,
      staff_created: staffCount,
      tasks_created: tasks.length,
    };
  }
}
