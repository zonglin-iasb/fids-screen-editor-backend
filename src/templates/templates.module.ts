import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TemplateEntity, TemplateSchema } from './schemas/template.schema'
import { TemplatesController } from './templates.controller'
import { TemplatesService } from './templates.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TemplateEntity.name, schema: TemplateSchema }]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
