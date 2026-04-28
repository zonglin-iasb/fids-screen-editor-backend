/**
 * Template-schema barrel — re-exports the editor's template TS types
 * and zod validation. Imported by the templates module so service code
 * has one tidy import path. When this gets extracted to a workspace
 * package later, only this folder moves and consumer imports update.
 */

export * from './template'
export * from './bands'
export * from './elements'
export * from './column'
export * from './animation'
export * from './fields'
export * from './status'
export * from './asset'

export {
  templateSchema,
  exportEnvelopeSchema,
  EXPORT_FORMAT,
  EXPORT_VERSION,
  parseTemplateJson,
} from './zod'
export type { TemplateValidationResult } from './zod'
