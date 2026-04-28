import { z } from 'zod'
import { TEMPLATE_STATUSES } from '../schemas/template.schema'

/**
 * SetStatusDto — body for PATCH /templates/:id/status. The schema is
 * intentionally narrow: status is the only field, and only the two
 * allowed values pass validation. Anything else (typos, malformed
 * casing, extra properties) gets rejected with the same path-based
 * 400 the rest of the API uses.
 */
export const setStatusSchema = z.object({
  status: z.enum([...TEMPLATE_STATUSES] as unknown as readonly [
    (typeof TEMPLATE_STATUSES)[number],
    ...(typeof TEMPLATE_STATUSES)[number][],
  ]),
})

export type SetStatusDto = z.infer<typeof setStatusSchema>
