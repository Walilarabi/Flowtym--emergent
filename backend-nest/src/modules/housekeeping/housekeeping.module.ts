import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HousekeepingTask, HousekeepingTaskSchema } from './schemas/task.schema';
import { Inspection, InspectionSchema } from './schemas/inspection.schema';
import { HousekeepingService } from './services/housekeeping.service';
import { HousekeepingController } from './controllers/housekeeping.controller';
import { HousekeepingGateway } from './gateways/housekeeping.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HousekeepingTask.name, schema: HousekeepingTaskSchema },
      { name: Inspection.name, schema: InspectionSchema },
    ]),
    RoomsModule,
    StaffModule,
  ],
  controllers: [HousekeepingController],
  providers: [HousekeepingService, HousekeepingGateway],
  exports: [HousekeepingService, HousekeepingGateway],
})
export class HousekeepingModule {}
