import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { StaffService } from '../services/staff.service';
import { StaffRole } from '../schemas/staff.schema';

@Controller('hotels/:hotelId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async findAll(
    @Param('hotelId') hotelId: string,
    @Query('role') role?: StaffRole,
  ) {
    return this.staffService.findAllByHotel(hotelId, role);
  }

  @Get('femmes-de-chambre')
  async findFemmesDeChambre(@Param('hotelId') hotelId: string) {
    return this.staffService.findFemmesDeChambre(hotelId);
  }

  @Get(':staffId')
  async findOne(@Param('staffId') staffId: string) {
    return this.staffService.findById(staffId);
  }

  @Put(':staffId/load')
  async updateLoad(
    @Param('staffId') staffId: string,
    @Body('increment') increment: number,
  ) {
    return this.staffService.updateLoad(staffId, increment);
  }

  @Post('reset-daily')
  async resetDaily(@Param('hotelId') hotelId: string) {
    await this.staffService.resetDailyStats(hotelId);
    return { success: true };
  }

  @Post('seed')
  async seedDemoStaff(@Param('hotelId') hotelId: string) {
    const count = await this.staffService.seedDemoStaff(hotelId);
    return { success: true, staff_created: count };
  }
}
