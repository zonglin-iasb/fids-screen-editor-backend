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
