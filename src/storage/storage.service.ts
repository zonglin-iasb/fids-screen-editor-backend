/**
 * IStorageService — the seam between domain modules and the underlying
 * blob store. Today there are two implementations: LocalFsStorageService
 * (on-prem) and GcsStorageService (cloud). StorageModule wires up two
 * named instances of one of those — one for assets, one for templates —
 * each with its own root dir / prefix.
 *
 * Streams over buffers when serving raw asset bytes (so a 5MB header bmp
 * doesn't fully buffer in Node's heap); buffers when reading structured
 * payloads like template JSON where stream-then-parse is just ceremony.
 */
export interface IStorageService {
  /** Write `buffer` under `id`. Overwrites if it already exists.
   *  `mime` is best-effort metadata so backends like GCS can serve
   *  the object with the right Content-Type when fetched directly. */
  put(id: string, buffer: Buffer, mime?: string): Promise<void>
  /** Stream the bytes back, or null if `id` is absent. */
  getStream(id: string): Promise<NodeJS.ReadableStream | null>
  /** Read the whole object into a Buffer, or null if absent. Use for
   *  small structured payloads (template JSON) where you'll parse the
   *  bytes anyway. */
  getBuffer(id: string): Promise<Buffer | null>
  /** Delete the bytes. Tolerant — missing id is a no-op. */
  remove(id: string): Promise<void>
  /** Optional client-redirect URL — when non-null, the controller 302s
   *  the caller there instead of streaming bytes through the API.
   *  GCS returns a signed URL; LocalFs returns null (= "stream it"). */
  getReadUrl(id: string): Promise<string | null>
  /** Synchronous storage-location ref (no I/O). Format mirrors the
   *  backend's native layout:
   *    GCS     → `<bucket>/<prefix><id>`     (e.g. `iasb/images/abc`)
   *    LocalFs → `<rootDir>/<id>`            (e.g. `uploads/assets/abc`)
   *  Used to populate `sourceRef` on new uploads so each record carries
   *  a human-readable pointer to where its bytes actually live. */
  getStorageRef(id: string): string
}

export const ASSET_STORAGE_SERVICE = Symbol('ASSET_STORAGE_SERVICE')
export const TEMPLATE_STORAGE_SERVICE = Symbol('TEMPLATE_STORAGE_SERVICE')
