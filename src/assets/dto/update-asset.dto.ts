import { z } from 'zod'
import { ASSET_CATEGORIES } from '../../template-schema/asset'

/**
 * UpdateAssetDto — body for PATCH /assets/:id. Both fields optional;
 * sending neither is a no-op (still bumps `updatedAt`). Unknown
 * categories are rejected with a path-based 400.
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
  })
  .refine((v) => v.name !== undefined || v.category !== undefined, {
    message: 'one of name or category must be provided',
  })

export type UpdateAssetDto = z.infer<typeof updateAssetSchema>
