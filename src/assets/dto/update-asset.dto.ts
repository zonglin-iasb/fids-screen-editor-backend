import { z } from 'zod'
import { ASSET_CATEGORIES } from '../../template-schema/asset'

/**
 * UpdateAssetDto — body for PATCH /assets/:id. All fields optional;
 * sending none is rejected. Unknown categories are rejected with a
 * path-based 400. `sourceRef` accepts null explicitly so callers can
 * clear a previously-set provenance ref.
 */
export const updateAssetSchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z
      .enum([...ASSET_CATEGORIES] as unknown as readonly [
        (typeof ASSET_CATEGORIES)[number],
        ...(typeof ASSET_CATEGORIES)[number][],
      ])
      .optional(),
    sourceRef: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.category !== undefined ||
      v.sourceRef !== undefined,
    { message: 'one of name, category, or sourceRef must be provided' },
  )

export type UpdateAssetDto = z.infer<typeof updateAssetSchema>
