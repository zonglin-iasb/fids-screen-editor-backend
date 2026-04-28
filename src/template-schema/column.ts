/**
 * FidsColumn — one vertical stripe shared by the ColumnHeaderBand and
 * the TabularMainBand. Tabular templates only.
 *
 * Knobs are split by field kind:
 *   - logo*     applies when FIDS_FIELD_META[field].kind === 'logo'
 *   - rotateTranslations / scrollDurationSec / styleRules
 *               apply when kind === 'status'
 *
 * Validation that ignored knobs aren't present is intentionally not
 * enforced in the type — it's an export-time check, not a render-time
 * concern.
 */

import type { FieldAnimation, LogoAnimation } from './animation'
import type { FidsField, FieldAlign } from './fields'
import type { StyleRule } from './status'

export interface ColumnCellStyle {
  fontWeight?: number
  fontSize?: number
  textColor?: string
}

export type LogoMode = 'fit' | 'fill' | 'freeform'

/**
 * Which slice of `flightNo` drives the airline-logo cycle:
 *   'flightNo'   — master + codeshares (default, current behaviour)
 *   'mainFlight' — just the master carrier (single logo, no cycle)
 *   'codeshares' — only the codeshare carriers (cycles through them)
 *
 * Mirrors the new `mainFlight` / `codeshares` text fields so a logo
 * column can pair with whichever flightNo column it sits next to.
 */
export type LogoSource = 'flightNo' | 'mainFlight' | 'codeshares'

export interface FidsColumn {
  id: string
  field: FidsField
  width: number
  align: FieldAlign

  headerLabel?: string
  hideHeader?: boolean
  headerCellStyle?: ColumnCellStyle
  cellStyle?: ColumnCellStyle

  /** Animation override; falls back to FIDS_FIELD_META[field].defaultAnimation. */
  animation?: FieldAnimation

  /**
   * compactNumeric — when true, strips leading zeros from numeric
   * segments at render time. Examples: B011 → B11, A005 → A5, H006R → H6R.
   * Useful in tight portrait columns (gate, terminal). Off by default.
   * Don't enable on time/date columns where leading zeros are
   * meaningful (08:00 would become 8:0).
   */
  compactNumeric?: boolean

  // ── Logo-only knobs ──
  logoMode?: LogoMode
  logoW?: number
  logoH?: number
  logoOffsetX?: number
  logoOffsetY?: number
  /** Entry animation for cycling logos. Defaults to LOGO_ANIMATION_DEFAULT. */
  logoAnimation?: LogoAnimation
  /** Which flightNo slice drives the logo cycle. Defaults to 'flightNo'. */
  logoSource?: LogoSource

  // ── Origin / Destination knobs ──
  /** When false, suppresses the "(XXX)" IATA code suffix. Defaults to true. */
  showAirportCode?: boolean

  // ── Status-only knobs ──
  rotateTranslations?: boolean
  scrollDurationSec?: number
  styleRules?: StyleRule[]
}
