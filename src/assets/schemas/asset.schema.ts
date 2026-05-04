import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ASSET_CATEGORIES, type AssetCategory } from '../../template-schema/asset'

export type AssetDocument = HydratedDocument<AssetEntity>

/**
 * AssetEntity — metadata for an uploaded image asset. Bytes live in the
 * IStorageService backend (local FS / GCS); this document holds only
 * the lightweight info the editor and renderer need.
 *
 * `width` / `height` are nullable because BMP variants and other edge
 * cases occasionally fail decode; the asset still saves so the user
 * can recover (re-export, re-upload).
 */
@Schema({ collection: 'assets', timestamps: true, versionKey: false })
export class AssetEntity {
  @Prop({ required: true, type: String })
  name: string

  @Prop({ required: true, type: String })
  mime: string

  @Prop({ required: true, type: Number })
  size: number

  @Prop({ type: Number, default: null })
  width: number | null

  @Prop({ type: Number, default: null })
  height: number | null

  @Prop({ required: true, type: String, enum: ASSET_CATEGORIES, default: 'other' })
  category: AssetCategory

  /** Provenance — where this asset came from when imported from another
   *  system. Null for direct uploads via the editor; set by import
   *  scripts or migrations. Free-form string (often a path like
   *  `FIDFCRCM2/<uuid>`); not constrained because legacy systems vary. */
  @Prop({ type: String, default: null })
  sourceRef: string | null
}

export const AssetSchema = SchemaFactory.createForClass(AssetEntity)
