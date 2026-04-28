/**
 * FieldAnimation — the closed set of cell transitions the runtime knows
 * how to play. Used by both `FidsColumn` (tabular) and `FieldBinding`
 * (dedicated text elements). New animations land here only after the
 * runtime gains a matching renderer.
 */
export const FIELD_ANIMATIONS = [
  'none',
  'fade',
  'slideUp',
  'slideDown',
  'slideLeft',
  'slideRight',
  'splitFlap',
] as const

export type FieldAnimation = (typeof FIELD_ANIMATIONS)[number]

/**
 * LogoAnimation — entry transitions for the airline-logo cell. Triggers
 * each tick when the cycling IATA code changes. Distinct from
 * FieldAnimation because per-character `splitFlap` doesn't apply to an
 * image, and image-only effects (`rise`, `zoom`, `flip`) make sense
 * only for the logo.
 */
export const LOGO_ANIMATIONS = [
  'none',
  'fade',
  'rise',
  'zoom',
  'flip',
  'slideUp',
  'slideDown',
  'slideLeft',
  'slideRight',
] as const

export type LogoAnimation = (typeof LOGO_ANIMATIONS)[number]

export const LOGO_ANIMATION_DEFAULT: LogoAnimation = 'rise'
