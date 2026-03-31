import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import { RoomStatus, CleaningStatus } from '../schemas/room.schema';

@Controller('hotels/:hotelId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async findAll(
    @Param('hotelId') hotelId: string,
    @Query('floor') floor?: number,
  ) {
    if (floor) {
      return this.roomsService.findByFloor(hotelId, floor);
    }
    return this.roomsService.findAllByHotel(hotelId);
  }

  @Get('stats')
  async getStats(@Param('hotelId') hotelId: string) {
    return this.roomsService.getStatsByHotel(hotelId);
  }

  @Get(':roomId')
  async findOne(@Param('roomId') roomId: string) {
    return this.roomsService.findById(roomId);
  }

  @Put(':roomId/status')
  async updateStatus(
    @Param('roomId') roomId: string,
    @Body('status') status: RoomStatus,
  ) {
    return this.roomsService.updateStatus(roomId, status);
  }

  @Put(':roomId/cleaning-status')
  async updateCleaningStatus(
    @Param('roomId') roomId: string,
    @Body() body: { cleaning_status: CleaningStatus; assignee?: string },
  ) {
    return this.roomsService.updateCleaningStatus(
      roomId,
      body.cleaning_status,
      body.assignee,
    );
  }

  @Put(':roomId/assign')
  async assignRoom(
    @Param('roomId') roomId: string,
    @Body() body: { staff_id: string; staff_name: string },
  ) {
    return this.roomsService.assignRoom(roomId, body.staff_id, body.staff_name);
  }

  @Post('seed')
  async seedDemoRooms(@Param('hotelId') hotelId: string) {
    const count = await this.roomsService.seedDemoRooms(hotelId);
    return { success: true, rooms_created: count };
  }
}
