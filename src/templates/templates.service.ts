import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { TemplateEntity, TemplateDocument, type TemplateStatus } from './schemas/template.schema'
import type { CreateTemplateDto } from './dto/create-template.dto'
import type { UpdateTemplateDto } from './dto/update-template.dto'
import type { Orientation, Template, TemplateType } from '../template-schema'

/**
 * TemplateMeta — the wire shape the editor's library list reads. Mirrors
 * the editor's local `templateStorage.TemplateMeta` so swapping the
 * editor's storage adapter to HTTP is a 1:1 field map.
 *
 * Dates serialize as epoch ms because that's what the editor stores
 * locally; keeping the wire format unchanged means relative-time
 * formatting in the cards keeps working without conversion.
 */
export interface TemplateMetaDto {
  id: string
  name: string
  type: TemplateType
  orientation: Orientation
  status: TemplateStatus
  schemaVersion: number
  publishedAt: number | null
  lastModified: number
  createdAt: number
}

export interface SavedTemplateDto {
  meta: TemplateMetaDto
  template: Template
}

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(TemplateEntity.name)
    private readonly model: Model<TemplateEntity>,
  ) {}

  async list(): Promise<TemplateMetaDto[]> {
    const docs = await this.model
      .find({}, { body: 0 })
      .sort({ updatedAt: -1 })
      .lean({ virtuals: false })
      .exec()
    return docs.map((d) => toMeta(d as unknown as TemplateDocument))
  }

  async getOne(id: string): Promise<SavedTemplateDto> {
    const doc = await this.findByIdOrThrow(id)
    return { meta: toMeta(doc), template: doc.body }
  }

  async create(dto: CreateTemplateDto): Promise<SavedTemplateDto> {
    // Pull denormalized fields from the body so the document is
    // queryable without a body parse on every list/filter.
    const created = await this.model.create({
      name: dto.name.trim() || 'Untitled',
      type: dto.body.type,
      orientation: dto.body.orientation,
      schemaVersion: dto.body.schemaVersion,
      status: 'draft',
      body: dto.body,
      publishedAt: null,
    })
    return { meta: toMeta(created), template: created.body }
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<SavedTemplateDto> {
    const doc = await this.findByIdOrThrow(id)

    if (dto.name !== undefined) {
      doc.name = dto.name.trim() || 'Untitled'
    }
    if (dto.body !== undefined) {
      doc.body = dto.body
      // Body's denormalized fields can change (orientation flip,
      // type swap) — keep the document-level copies in sync.
      doc.type = dto.body.type
      doc.orientation = dto.body.orientation
      doc.schemaVersion = dto.body.schemaVersion
    }

    await doc.save()
    return { meta: toMeta(doc), template: doc.body }
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.deleteOne({ _id: this.toObjectId(id) }).exec()
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Template ${id} not found`)
    }
  }

  // ── Internals ────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string): Promise<TemplateDocument> {
    const _id = this.toObjectId(id)
    if (!_id) throw new NotFoundException(`Template ${id} not found`)
    const doc = await this.model.findById(_id).exec()
    if (!doc) throw new NotFoundException(`Template ${id} not found`)
    return doc
  }

  /** Tolerant cast — if the id isn't a valid ObjectId we treat it as
   *  not-found rather than 500ing the request. */
  private toObjectId(id: string): Types.ObjectId | null {
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null
  }
}

function toMeta(doc: TemplateDocument): TemplateMetaDto {
  // `lean()` returns a plain object so timestamps are Date instances or
  // already millis depending on the path. `getTime()` covers both.
  const createdAt = (doc.get?.('createdAt') ?? (doc as any).createdAt) as Date | number | undefined
  const updatedAt = (doc.get?.('updatedAt') ?? (doc as any).updatedAt) as Date | number | undefined
  const publishedAt = (doc.get?.('publishedAt') ?? doc.publishedAt) as Date | null | undefined

  return {
    id: String(doc._id),
    name: doc.name,
    type: doc.type,
    orientation: doc.orientation,
    status: doc.status,
    schemaVersion: doc.schemaVersion,
    publishedAt: toMs(publishedAt),
    lastModified: toMs(updatedAt) ?? 0,
    createdAt: toMs(createdAt) ?? 0,
  }
}

function toMs(v: Date | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return v
  return v.getTime()
}
