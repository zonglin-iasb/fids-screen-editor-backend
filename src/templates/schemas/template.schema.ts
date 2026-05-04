import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import {
  ORIENTATIONS,
  TEMPLATE_TYPES,
  type Orientation,
  type TemplateType,
} from '../../template-schema'

export type TemplateStatus = 'draft' | 'published'
export const TEMPLATE_STATUSES: readonly TemplateStatus[] = ['draft', 'published']

export type TemplateDocument = HydratedDocument<TemplateEntity>

/**
 * TemplateEntity — Mongo-side metadata for a template. The actual
 * template JSON (bands, elements, etc.) lives in the storage backend
 * keyed by `_id`; this document holds only the queryable fields that
 * power the library list and routing decisions. The service keeps the
 * denormalized `type` / `orientation` / `schemaVersion` in sync with
 * the body at write time.
 */
@Schema({ collection: 'templates', timestamps: true, versionKey: false })
export class TemplateEntity {
  @Prop({ required: true, type: String, default: 'Untitled' })
  name: string

  @Prop({ required: true, type: String, enum: TEMPLATE_TYPES })
  type: TemplateType

  @Prop({ required: true, type: String, enum: ORIENTATIONS })
  orientation: Orientation

  @Prop({ required: true, type: String, enum: TEMPLATE_STATUSES, default: 'draft' })
  status: TemplateStatus

  @Prop({ required: true, type: Number })
  schemaVersion: number

  @Prop({ type: Date, default: null })
  publishedAt: Date | null

  /** Provenance — where this template came from when imported from
   *  another system. Null for templates authored directly in the editor;
   *  set by import scripts or migrations. Free-form string. */
  @Prop({ type: String, default: null })
  sourceRef: string | null
}

export const TemplateSchema = SchemaFactory.createForClass(TemplateEntity)
