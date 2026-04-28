import { z } from 'zod'
import { templateSchema } from '../../template-schema'

/**
 * UpdateTemplateDto — the wire shape for PUT /templates/:id. Both
 * fields are optional so the editor can rename without sending the
 * full body, or vice versa. Sending neither is a no-op (the service
 * still bumps `updatedAt` so the library list can re-sort).
 */
export const updateTemplateSchema = z
  .object({
    name: z.string().min(1).optional(),
    body: templateSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.body !== undefined, {
    message: 'one of name or body must be provided',
  })

export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>
