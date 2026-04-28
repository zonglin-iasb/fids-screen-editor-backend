import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes } from 'mongoose'
import {
  ORIENTATIONS,
  TEMPLATE_TYPES,
  type Orientation,
  type Template,
  type TemplateType,
} from '../../template-schema'

export type TemplateStatus = 'draft' | 'published'
export const TEMPLATE_STATUSES: readonly TemplateStatus[] = ['draft', 'published']

export type TemplateDocument = HydratedDocument<TemplateEntity>

/**
 * TemplateEntity — the persisted shape. The full editor template body
 * is stored as `Mixed` because the discriminated union of bands +
 * elements doesn't map cleanly to a static Mongoose schema and we'd be
 * duplicating validation that zod already does at the HTTP boundary.
 *
 * `name`, `type`, `orientation`, `status` are denormalized from `body`
 * onto the document so the list endpoint can return metadata without
 * walking each body. The service keeps these in sync at write time.
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

  @Prop({ required: true, type: SchemaTypes.Mixed })
  body: Template

  @Prop({ type: Date, default: null })
  publishedAt: Date | null
}

export const TemplateSchema = SchemaFactory.createForClass(TemplateEntity)
