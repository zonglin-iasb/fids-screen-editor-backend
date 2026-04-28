import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AssetsController } from './assets.controller'
import { AssetsService } from './assets.service'
import { AssetEntity, AssetSchema } from './schemas/asset.schema'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [
    StorageModule,
    MongooseModule.forFeature([{ name: AssetEntity.name, schema: AssetSchema }]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
