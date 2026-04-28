import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import sharp from 'sharp'
import { imageSize } from 'image-size'
import {
  ASSET_CATEGORIES,
  type AssetCategory,
} from '../template-schema/asset'
import { AssetEntity, type AssetDocument } from './schemas/asset.schema'
import type { UpdateAssetDto } from './dto/update-asset.dto'
import { IStorageService, STORAGE_SERVICE } from '../storage/storage.service'

/**
 * AssetMetaDto — response shape for the editor's library list. Mirrors
 * `editor's local AssetMeta` so the client adapter can drop straight
 * in. `url` is the absolute path the editor / renderer render an
 * `<img src=...>` against; today that's our `/assets/:id/raw` route,
 * tomorrow it could be a signed GCS URL.
 */
export interface AssetMetaDto {
  id: string
  name: string
  mime: string
  size: number
  width: number | null
  height: number | null
  category: AssetCategory
  createdAt: number
  url: string
}

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name)
  private readonly publicBase: string

  constructor(
    @InjectModel(AssetEntity.name)
    private readonly model: Model<AssetEntity>,
    @Inject(STORAGE_SERVICE)
    private readonly storage: IStorageService,
    config: ConfigService,
  ) {
    // PUBLIC_BASE_URL lets the API advertise a different origin than the
    // listening port — useful behind reverse proxies. Falls back to
    // localhost:PORT for the POC. No trailing slash.
    const port = Number(config.get<string>('PORT') ?? 3010)
    const fallback = `http://localhost:${port}`
    const base = config.get<string>('PUBLIC_BASE_URL') ?? fallback
    this.publicBase = base.replace(/\/$/, '')
  }

  async list(): Promise<AssetMetaDto[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).lean({ virtuals: false }).exec()
    return docs.map((d) => this.toMeta(d as unknown as AssetDocument))
  }

  async upload(
    file: Express.Multer.File,
    category: AssetCategory | undefined,
  ): Promise<AssetMetaDto> {
    if (!file?.buffer || file.size === 0) {
      throw new Error('No file uploaded')
    }
    const dims = await this.decodeDimensions(file.buffer, file.mimetype)
    const cat = ASSET_CATEGORIES.includes(category as AssetCategory)
      ? (category as AssetCategory)
      : 'other'

    // Mongo mints the _id; we use that as the storage key so the meta
    // record and the bytes stay in lockstep.
    const created = await this.model.create({
      name: file.originalname,
      mime: file.mimetype || 'application/octet-stream',
      size: file.size,
      width: dims.width,
      height: dims.height,
      category: cat,
    })
    try {
      await this.storage.put(String(created._id), file.buffer)
    } catch (err) {
      // Storage write failed — roll back the meta record so we don't
      // leave a dangling pointer to nothing.
      await this.model.deleteOne({ _id: created._id }).exec()
      throw err
    }
    return this.toMeta(created)
  }

  async getStream(id: string): Promise<{ stream: NodeJS.ReadableStream; mime: string } | null> {
    const doc = await this.findByIdOrNull(id)
    if (!doc) return null
    const stream = await this.storage.getStream(id)
    if (!stream) {
      this.logger.warn(`asset ${id} has meta but no bytes — orphan`)
      return null
    }
    return { stream, mime: doc.mime }
  }

  async update(id: string, dto: UpdateAssetDto): Promise<AssetMetaDto> {
    const doc = await this.findByIdOrThrow(id)
    if (dto.name !== undefined) doc.name = dto.name.trim() || doc.name
    if (dto.category !== undefined) doc.category = dto.category
    await doc.save()
    return this.toMeta(doc)
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findByIdOrNull(id)
    if (!doc) throw new NotFoundException(`Asset ${id} not found`)
    await this.storage.remove(id)
    await this.model.deleteOne({ _id: doc._id }).exec()
  }

  /**
   * resolveUrl — exposed for the renderer-fetch endpoint so it can
   * build the assetUrlMap from a list of asset ids without going
   * through `list()`.
   */
  resolveUrl(id: string): string {
    return `${this.publicBase}/assets/${id}/raw`
  }

  // ── Internals ────────────────────────────────────────────────────

  private async decodeDimensions(buffer: Buffer, mime: string): Promise<{ width: number | null; height: number | null }> {
    // Try image-size first — it reads headers only, no full decode, and
    // handles BMP variants that libvips refuses (the legacy headers in
    // public/ are exactly such variants). Sharp is the fallback for
    // formats image-size doesn't recognize.
    try {
      const sized = imageSize(buffer)
      if (sized?.width && sized?.height) {
        return { width: sized.width, height: sized.height }
      }
    } catch {
      // Fall through to sharp.
    }
    try {
      const meta = await sharp(buffer).metadata()
      return {
        width: meta.width ?? null,
        height: meta.height ?? null,
      }
    } catch (err) {
      this.logger.warn(`could not decode dimensions for ${mime}: ${(err as Error).message}`)
      return { width: null, height: null }
    }
  }

  private async findByIdOrNull(id: string): Promise<AssetDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null
    return this.model.findById(new Types.ObjectId(id)).exec()
  }

  private async findByIdOrThrow(id: string): Promise<AssetDocument> {
    const doc = await this.findByIdOrNull(id)
    if (!doc) throw new NotFoundException(`Asset ${id} not found`)
    return doc
  }

  private toMeta(doc: AssetDocument): AssetMetaDto {
    const id = String(doc._id)
    const createdAt = (doc.get?.('createdAt') ?? (doc as any).createdAt) as Date | number | undefined
    return {
      id,
      name: doc.name,
      mime: doc.mime,
      size: doc.size,
      width: doc.width ?? null,
      height: doc.height ?? null,
      category: doc.category,
      createdAt: toMs(createdAt) ?? 0,
      url: this.resolveUrl(id),
    }
  }
}

function toMs(v: Date | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return v
  return v.getTime()
}
