/**
 * FoundItems Module - Gestion des objets trouvés
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoundItem, FoundItemSchema } from './schemas/found-item.schema';
import { FoundItemService } from './services/found-item.service';
import { FoundItemController } from './controllers/found-item.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FoundItem.name, schema: FoundItemSchema },
    ]),
  ],
  controllers: [FoundItemController],
  providers: [FoundItemService],
  exports: [FoundItemService],
})
export class FoundItemsModule {}
