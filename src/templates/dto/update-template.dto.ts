import { z } from 'zod'
import { templateSchema } from '../../template-schema'

/**
 * UpdateTemplateDto — the wire shape for PUT /templates/:id. All fields
 * are optional so the editor can rename without sending the full body,
 * or vice versa. Sending none is rejected.
 *
 * `sourceRef` accepts null explicitly so callers can clear a
 * previously-set provenance ref.
 */
export const updateTemplateSchema = z
  .object({
    name: z.string().min(1).optional(),
    body: templateSchema.optional(),
    sourceRef: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.body !== undefined ||
      v.sourceRef !== undefined,
    { message: 'one of name, body, or sourceRef must be provided' },
  )

export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>
