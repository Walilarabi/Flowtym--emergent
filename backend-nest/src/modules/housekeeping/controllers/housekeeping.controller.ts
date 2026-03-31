import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { HousekeepingService } from '../services/housekeeping.service';
import { InspectionResult } from '../schemas/inspection.schema';

@Controller('hotels/:hotelId/housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  // ==================== STATS ====================

  @Get('stats')
  async getStats(@Param('hotelId') hotelId: string) {
    return this.housekeepingService.getStats(hotelId);
  }

  // ==================== TASKS ====================

  @Get('tasks')
  async getTasks(
    @Param('hotelId') hotelId: string,
    @Query('date') date?: string,
  ) {
    return this.housekeepingService.getTasks(hotelId, date);
  }

  @Get('tasks/staff/:staffId')
  async getTasksByStaff(
    @Param('hotelId') hotelId: string,
    @Param('staffId') staffId: string,
  ) {
    return this.housekeepingService.getTasksByStaff(hotelId, staffId);
  }

  @Post('tasks/:taskId/start')
  async startTask(
    @Param('hotelId') hotelId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.housekeepingService.startTask(hotelId, taskId);
  }

  @Post('tasks/:taskId/complete')
  async completeTask(
    @Param('hotelId') hotelId: string,
    @Param('taskId') taskId: string,
    @Body() body: { photos_after?: string[]; notes?: string },
  ) {
    return this.housekeepingService.completeTask(
      hotelId,
      taskId,
      body.photos_after,
      body.notes,
    );
  }

  @Post('tasks/assign')
  async assignTasks(
    @Param('hotelId') hotelId: string,
    @Body() body: { task_ids: string[]; staff_id: string; staff_name: string },
  ) {
    const count = await this.housekeepingService.assignTasks(
      hotelId,
      body.task_ids,
      body.staff_id,
      body.staff_name,
    );
    return { success: true, assigned: count };
  }

  // ==================== INSPECTIONS ====================

  @Get('inspections')
  async getInspections(
    @Param('hotelId') hotelId: string,
    @Query('status') status?: InspectionResult,
  ) {
    return this.housekeepingService.getInspections(hotelId, status);
  }

  @Post('inspections/:inspectionId/validate')
  async validateInspection(
    @Param('hotelId') hotelId: string,
    @Param('inspectionId') inspectionId: string,
    @Body()
    body: {
      approved: boolean;
      rating: number;
      comments?: string;
      refused_reason?: string;
      inspected_by_name?: string;
    },
  ) {
    return this.housekeepingService.validateInspection(
      hotelId,
      inspectionId,
      body.approved,
      body.rating,
      body.comments || '',
      body.refused_reason,
      body.inspected_by_name,
    );
  }

  // ==================== AUTO ASSIGNMENT ====================

  @Post('assignments/auto')
  async autoAssign(
    @Param('hotelId') hotelId: string,
    @Body() body: { strategy?: 'balanced' | 'floor' },
  ) {
    const count = await this.housekeepingService.autoAssign(
      hotelId,
      body.strategy || 'balanced',
    );
    return { success: true, assigned: count };
  }

  // ==================== SEED ====================

  @Post('seed')
  async seedDemoData(@Param('hotelId') hotelId: string) {
    return this.housekeepingService.seedDemoData(hotelId);
  }
}
