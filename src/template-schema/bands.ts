/**
 * Band shapes — the four stacked strips that compose the artboard.
 *
 *   header        FreeformBand          freeform children only
 *   columnHeader  ColumnHeaderBand      tabular templates only
 *   main          TabularMainBand       tabular templates
 *                 DedicatedMainBand     dedicated templates
 *   footer        FreeformBand          freeform children only
 *
 * Tabular vs. dedicated is decided by Template.type; this file only
 * defines the shapes a band can take. Composition lives in template.ts.
 */

import type { ClockElement, ImageElement, LogoElement, RectElement, TextElement } from './elements'

export const BAND_IDS = ['header', 'columnHeader', 'main', 'footer'] as const
export type BandId = (typeof BAND_IDS)[number]

/** Bands that host freeform children. Dedicated `main` is freeform too. */
export type FreeformBandId = 'header' | 'main' | 'footer'

export type FreeformChild = RectElement | TextElement | LogoElement | ClockElement | ImageElement

export interface FreeformBand {
  enabled: boolean
  height: number
  bg?: string
  children: FreeformChild[]
}

export type BandFont = 'board' | 'sans' | 'mono'

/**
 * BoundBandStyle — per-band defaults for the FIDS-bound bands. One font
 * / colour / bg / padding per band; per-cell or per-column overrides
 * live on FidsColumn.
 */
export interface BoundBandStyle {
  font: BandFont
  fontSize: number
  fontWeight: number
  textColor: string
  bg?: string
  padding: number
}

export interface ColumnHeaderBand {
  enabled: boolean
  height: number
  style: BoundBandStyle
}

export interface TabularMainBand {
  height: number
  rowHeight: number
  zebra: boolean
  zebraColor?: string
  style: BoundBandStyle
}

export interface DedicatedMainBand {
  height: number
  bg?: string
  children: FreeformChild[]
}

/**
 * SplitAxis — how a multi-row main band lays out its row stamps:
 *
 *   'vertical'   columns split left-to-right by a vertical divider
 *                (gate Double — design ONE column, render `rowCount` of them)
 *   'horizontal' rows stacked top-to-bottom, divided by a horizontal line
 *                (carousel — same pattern, different axis; reserved for later)
 *
 * Older saved templates predate this field; the renderer treats absent
 * splitAxis as 'vertical' (the only multi type today is the
 * dedicatedDoubleGate, which always splits vertically). Future
 * horizontal consumers (e.g. carousel) must set the field explicitly.
 */
export type SplitAxis = 'vertical' | 'horizontal'

/**
 * DedicatedMultiMainBand — the multi-flight dedicated variant. The
 * `children` array describes ONE row, authored at row-relative
 * coordinates (origin = top-left of one row stamp). The canvas stamps
 * it `rowCount` times along `splitAxis`, separated by `rowGap` and an
 * optional `rowDivider`. Each stamp resolves bound text + sync logos
 * against `previewFlights[(previewFlightIndex + rowIdx) % flights.length]`,
 * giving an N-flight split-screen preview.
 *
 * Modelled with the same `children` field name as DedicatedMainBand so
 * the existing band-walking helpers (findChildContext,
 * updateFreeformBandIn, layers panel, template-IO asset walker, etc.)
 * keep working without per-band branches.
 */
export interface DedicatedMultiMainBand {
  height: number
  rowCount: number
  rowGap: number
  splitAxis?: SplitAxis
  rowDivider?: { color: string; thickness: number }
  bg?: string
  children: FreeformChild[]
}
