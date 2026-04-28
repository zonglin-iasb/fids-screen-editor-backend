import { BadRequestException, PipeTransform } from '@nestjs/common'
import type { ZodSchema } from 'zod'

/**
 * ZodValidationPipe — generic body/query/param validator wrapping a zod
 * schema. Used as `@UsePipes(new ZodValidationPipe(schema))` or scoped
 * to a controller method via `@Body(new ZodValidationPipe(schema))`.
 *
 * Errors are flattened into a 400 with the same `<path>: <message>`
 * shape the editor's import dialog uses, so frontend error messages
 * stay consistent regardless of source.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      const first = result.error.issues[0]
      const where = first?.path.length ? first.path.join('.') : '<root>'
      const what = first?.message ?? 'Validation failed'
      throw new BadRequestException(`${where}: ${what}`)
    }
    return result.data
  }
}
