/**
 * Template — the top-level editor document. Discriminated by `type`:
 *
 *   tabular    multi-user screens — column-driven, paginated rows
 *              (multiUserDepartures, multiUserArrivals, multiUserBaggage)
 *
 *   dedicated  single-flight screens — freeform main band with
 *              field-bound text/logo elements
 *              (dedicatedGate, dedicatedBaggage)
 *
 * The two shapes share header/footer; everything else differs. The
 * runtime decides what to fetch (single flight vs. cluster feed) from
 * `type` alone.
 */

import type {
  ColumnHeaderBand,
  DedicatedMainBand,
  FreeformBand,
  TabularMainBand,
} from './bands'
import type { FidsColumn } from './column'

export const TEMPLATE_TYPES = [
  'multiUserDepartures',
  'multiUserArrivals',
  'multiUserBaggage',
  'dedicatedGate',
  'dedicatedBaggage',
] as const
export type TemplateType = (typeof TEMPLATE_TYPES)[number]

export const TABULAR_TYPES = [
  'multiUserDepartures',
  'multiUserArrivals',
  'multiUserBaggage',
] as const
export type TabularTemplateType = (typeof TABULAR_TYPES)[number]

export const DEDICATED_TYPES = ['dedicatedGate', 'dedicatedBaggage'] as const
export type DedicatedTemplateType = (typeof DEDICATED_TYPES)[number]

export const SCHEMA_VERSION = 1
export type SchemaVersion = typeof SCHEMA_VERSION

/** Default cycle period (ms) for fresh templates and the fallback when older
 *  saved/exported templates lack the field. Mirrored in tickStore for the
 *  runtime interval driver. */
export const DEFAULT_TEMPLATE_CYCLE_MS = 4000

export const ORIENTATIONS = ['landscape', 'portrait'] as const
export type Orientation = (typeof ORIENTATIONS)[number]

interface TemplateBase {
  schemaVersion: SchemaVersion
  orientation: Orientation
  /** Period of one animation cycle in milliseconds. Drives every AnimatedText
   *  cell's `tick % values.length`. Editable in the Animation inspector;
   *  persisted with the template so saved/exported boards keep their tempo. */
  cycleMs: number
  header: FreeformBand
  footer: FreeformBand
}

export interface TabularTemplate extends TemplateBase {
  type: TabularTemplateType
  columnHeader: ColumnHeaderBand
  main: TabularMainBand
  /** Column set rendered when orientation === 'landscape'. Sums to 1920. */
  columnsLandscape: FidsColumn[]
  /** Column set rendered when orientation === 'portrait'. Sums to 1080.
   *  Independent edit surface — flipping orientation does not migrate
   *  edits between the two lists. */
  columnsPortrait: FidsColumn[]
}

export interface DedicatedTemplate extends TemplateBase {
  type: DedicatedTemplateType
  main: DedicatedMainBand
}

export type Template = TabularTemplate | DedicatedTemplate

export const isTabular = (t: Template): t is TabularTemplate =>
  (TABULAR_TYPES as readonly string[]).includes(t.type)

export const isDedicated = (t: Template): t is DedicatedTemplate =>
  (DEDICATED_TYPES as readonly string[]).includes(t.type)

/** Active column list for the template's current orientation. */
export function activeColumns(t: TabularTemplate): FidsColumn[] {
  return t.orientation === 'portrait' ? t.columnsPortrait : t.columnsLandscape
}

/** Returns a new template with `cols` written to the orientation's column slot. */
export function setActiveColumns(t: TabularTemplate, cols: FidsColumn[]): TabularTemplate {
  return t.orientation === 'portrait'
    ? { ...t, columnsPortrait: cols }
    : { ...t, columnsLandscape: cols }
}

export const TEMPLATE_TYPE_LABEL: Record<TemplateType, string> = {
  multiUserDepartures: 'Multi-user · Departures',
  multiUserArrivals: 'Multi-user · Arrivals',
  multiUserBaggage: 'Multi-user · Baggage',
  dedicatedGate: 'Dedicated · Gate',
  dedicatedBaggage: 'Dedicated · Baggage',
}

/**
 * TEMPLATE_TYPE_TO_DISPLAY_TYPE — export contract. Maps the editor's
 * friendly `TemplateType` keys to pos_frontend's numeric `DisplayType`
 * enum (mirrors `@industronics/fids-utils/dist/.../display.type.d.ts`):
 *
 *   1 MultiUserDeparture · 2 MultiUserArrival · 3 MultiUserBaggage
 *   4 MultiUserCheckIn   · 5 DedicatedGate    · 6 DedicatedCheckIn
 *   7 DedicatedCarousel  · 8 DedicatedCheckInRow
 *
 * The editor only models 5 of those 8 today; the omitted check-in
 * variants have no entry here.
 */
export const TEMPLATE_TYPE_TO_DISPLAY_TYPE: Record<TemplateType, number> = {
  multiUserDepartures: 1,
  multiUserArrivals: 2,
  multiUserBaggage: 3,
  dedicatedGate: 5,
  dedicatedBaggage: 7,
}
