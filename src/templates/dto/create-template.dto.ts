import { z } from 'zod'
import { templateSchema } from '../../template-schema'

/**
 * CreateTemplateDto — the wire shape the editor POSTs when minting a
 * new template. The `body` is validated against the full editor zod
 * schema; `name` is just a string trimmed at the service layer.
 *
 * The seeded body is produced by the editor (its `defaults.ts` knows
 * the right per-type defaults) — backend stays a dumb store.
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'name must not be empty'),
  body: templateSchema,
  /** Optional provenance — populated by import scripts; the editor's
   *  POST flow leaves it absent. */
  sourceRef: z.string().nullable().optional(),
})

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>
