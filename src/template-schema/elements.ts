/**
 * Element schema — discriminated union of freeform children that render
 * inside any FreeformBand (header, footer, or a dedicated template's
 * main band).
 *
 * Text and Logo elements support an optional `bind` so dedicated
 * templates can substitute live flight values at render time. Rect is
 * decorative-only and never binds.
 */

import type { FieldAnimation } from './animation'
import type { FidsField } from './fields'

export type FontFamily = 'board' | 'sans' | 'mono'
export type TextAlign = 'left' | 'center' | 'right'

export interface BaseElement {
  id: string
  x: number
  y: number
  w: number
  h: number
  hidden?: boolean
  locked?: boolean
  aspectLocked?: boolean
}

/**
 * FieldBinding — when present on a TextElement, the element renders the
 * flight value for `field` instead of its literal `text`. Logo binding
 * lives on LogoElement directly via `syncWithFlightNo`.
 */
export interface FieldBinding {
  field: FidsField
  animation?: FieldAnimation
}

export interface RectElement extends BaseElement {
  type: 'rect'
  fill?: string
}

export interface TextElement extends BaseElement {
  type: 'text'
  text?: string
  textColor?: string
  fontSize?: number
  fontFamily?: FontFamily
  fontWeight?: number
  textAlign?: TextAlign
  bind?: FieldBinding
}

export interface LogoElement extends BaseElement {
  type: 'logo'
  fill?: string
  /** Static IATA — used when `syncWithFlightNo` is false/undefined. */
  iataCode?: string
  /** When true, the rendered logo cycles in lockstep with the
   *  template's flightNo binding (single source of truth: the
   *  flight-number string itself, IATA derived via split-on-space). */
  syncWithFlightNo?: boolean
}

/**
 * ImageObjectFit — how the image should sit inside its element box.
 *   'cover'    crop to fill (default — what legacy header bmps want)
 *   'contain'  fit fully, may letterbox
 *   'fill'     stretch to box (distorts aspect)
 */
export type ImageObjectFit = 'cover' | 'contain' | 'fill'

/**
 * ImageElement — raster (bmp/png/jpg) drop. Source is a URL relative to
 * the deployment root (Vite serves anything under `public/` at `/<file>`),
 * or any absolute URL. Empty src renders a placeholder so the layer is
 * visible while the user wires it up.
 */
export interface ImageElement extends BaseElement {
  type: 'image'
  src?: string
  objectFit?: ImageObjectFit
}

/**
 * ClockFormat — what the clock element renders. Time, date, and
 * combined variants share the element shape; they're just different
 * format strings on the same live-updating component.
 *
 *   Time:
 *     'HH:mm'              24-hour, no seconds  (default)
 *     'HH:mm:ss'           24-hour, with seconds
 *     'h:mm a'             12-hour with AM/PM
 *   Date:
 *     'd MMM'              18 Jan
 *     'd MMM yyyy'         18 Jan 2026
 *     'EEE, d MMM'         Mon, 18 Jan
 *   Date & time (combined, ' · ' separator):
 *     'HH:mm · d MMM'      14:32 · 18 Jan
 *     'd MMM · HH:mm'      18 Jan · 14:32
 *     'EEE · HH:mm'        Mon · 14:32
 *     'EEE d MMM · HH:mm'  Mon 18 Jan · 14:32
 */
export type ClockFormat =
  | 'HH:mm'
  | 'HH:mm:ss'
  | 'h:mm a'
  | 'd MMM'
  | 'd MMM yyyy'
  | 'EEE, d MMM'
  | 'HH:mm · d MMM'
  | 'd MMM · HH:mm'
  | 'EEE · HH:mm'
  | 'EEE d MMM · HH:mm'

export const TIME_FORMATS: readonly ClockFormat[] = ['HH:mm', 'HH:mm:ss', 'h:mm a']
export const DATE_FORMATS: readonly ClockFormat[] = ['d MMM', 'd MMM yyyy', 'EEE, d MMM']
export const COMBINED_FORMATS: readonly ClockFormat[] = [
  'HH:mm · d MMM',
  'd MMM · HH:mm',
  'EEE · HH:mm',
  'EEE d MMM · HH:mm',
]

export function isDateFormat(f: ClockFormat): boolean {
  return (DATE_FORMATS as readonly string[]).includes(f)
}

/** True for any format containing a time portion (used to decide
 *  the live-clock interval and the auto editorial label). */
export function hasTime(f: ClockFormat): boolean {
  return (TIME_FORMATS as readonly string[]).includes(f) || (COMBINED_FORMATS as readonly string[]).includes(f)
}

/**
 * ClockStyle — visual treatment for the clock element. Each style
 * applies to both time AND date formats; the renderer handles the
 * substring layout consistently.
 *
 *   'plain'      naked text (default)
 *   'splitFlap'  Solari board cards — each char in a flip-style panel
 *   'pillChip'   value inside a rounded pill with contrasting bg
 *   'editorial'  small uppercase label above + value below
 */
export type ClockStyle = 'plain' | 'splitFlap' | 'pillChip' | 'editorial'

export interface ClockElement extends BaseElement {
  type: 'clock'
  format?: ClockFormat
  style?: ClockStyle
  textColor?: string
  fontSize?: number
  fontFamily?: FontFamily
  fontWeight?: number
  textAlign?: TextAlign
  /** editorial-only: label shown above the value. Auto-derived from
   *  format when omitted (LOCAL / TODAY / DATE). */
  label?: string
  /** pillChip-only: pill background. Defaults to '#0A0A0A'. */
  pillBg?: string
}

export type CanvasElement = RectElement | TextElement | LogoElement | ClockElement | ImageElement

type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never
export type ElementInit = DistributiveOmit<CanvasElement, 'id'>

export const isRect = (e: CanvasElement): e is RectElement => e.type === 'rect'
export const isText = (e: CanvasElement): e is TextElement => e.type === 'text'
export const isLogo = (e: CanvasElement): e is LogoElement => e.type === 'logo'
export const isClock = (e: CanvasElement): e is ClockElement => e.type === 'clock'
export const isImage = (e: CanvasElement): e is ImageElement => e.type === 'image'
