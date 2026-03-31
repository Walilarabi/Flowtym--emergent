import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { StaffModule } from './modules/staff/staff.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../backend/.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL') || 'mongodb://localhost:27017',
        dbName: configService.get<string>('DB_NAME') || 'test_database',
      }),
      inject: [ConfigService],
    }),
    HousekeepingModule,
    RoomsModule,
    StaffModule,
  ],
})
export class AppModule {}
