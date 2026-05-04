import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Response } from 'express'
import { AssetsService, type AssetMetaDto } from './assets.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { updateAssetSchema, type UpdateAssetDto } from './dto/update-asset.dto'
import { ASSET_CATEGORIES, type AssetCategory } from '../template-schema/asset'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20MB — comfortable for header bmps

/**
 * AssetsController — REST surface for uploaded image assets.
 *
 *   POST   /assets               multipart/form-data, returns AssetMetaDto
 *   GET    /assets                full meta list
 *   GET    /assets/:id/raw        streamed bytes with correct Content-Type
 *   PATCH  /assets/:id            rename / recategorize
 *   DELETE /assets/:id            delete meta + bytes
 *
 * The category to apply on upload is read from the `category` query
 * param (e.g. `?category=header`); the editor's picker passes whatever
 * filter is active when the user hits "Upload".
 */
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list(): Promise<AssetMetaDto[]> {
    return this.assets.list()
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('category') category?: string,
    @Query('sourceRef') sourceRef?: string,
  ): Promise<AssetMetaDto> {
    if (!file) {
      throw new BadRequestException('Expected a multipart/form-data field named "file"')
    }
    const cat = ASSET_CATEGORIES.includes(category as AssetCategory)
      ? (category as AssetCategory)
      : undefined
    return this.assets.upload(file, cat, sourceRef)
  }

  @Get(':id/raw')
  async raw(@Param('id') id: string, @Res() res: Response): Promise<void> {
    // Cloud mode: storage layer hands us a signed URL — 302 there so
    // bytes flow direct from GCS to the browser, bypassing Node.
    const redirectUrl = await this.assets.getRedirectUrl(id)
    if (redirectUrl) {
      // Cap browser caching of the redirect under the signed URL TTL
      // so a stale 302 doesn't outlive the URL it points to.
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.redirect(302, redirectUrl)
      return
    }

    // On-prem mode: stream bytes through the API.
    const result = await this.assets.getStream(id)
    if (!result) throw new NotFoundException(`Asset ${id} not found`)
    res.setHeader('Content-Type', result.mime)
    res.setHeader('Cache-Control', 'public, max-age=300')
    result.stream.pipe(res)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAssetSchema)) dto: UpdateAssetDto,
  ): Promise<AssetMetaDto> {
    return this.assets.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.assets.remove(id)
  }
}
