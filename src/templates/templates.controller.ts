import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common'
import { TemplatesService, type SavedTemplateDto, type TemplateMetaDto } from './templates.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createTemplateSchema,
  type CreateTemplateDto,
} from './dto/create-template.dto'
import {
  updateTemplateSchema,
  type UpdateTemplateDto,
} from './dto/update-template.dto'

/**
 * TemplatesController — REST surface mirroring the editor's local
 * `templateStorage` interface 1:1, so the editor's swap to HTTP is a
 * drop-in adapter swap.
 *
 *   GET    /templates         meta-only list (sorted newest-first)
 *   GET    /templates/:id     full SavedTemplate { meta, template }
 *   POST   /templates         create from { name, body }
 *   PUT    /templates/:id     update name and/or body
 *   DELETE /templates/:id     hard delete
 *
 * Status flip and renderer-fetch endpoints land in their own slices.
 */
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(): Promise<TemplateMetaDto[]> {
    return this.templates.list()
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<SavedTemplateDto> {
    return this.templates.getOne(id)
  }

  @Post()
  @UsePipes()
  create(
    @Body(new ZodValidationPipe(createTemplateSchema)) dto: CreateTemplateDto,
  ): Promise<SavedTemplateDto> {
    return this.templates.create(dto)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTemplateSchema)) dto: UpdateTemplateDto,
  ): Promise<SavedTemplateDto> {
    return this.templates.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.templates.remove(id)
  }
}
