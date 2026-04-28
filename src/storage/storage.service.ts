/**
 * IStorageService — the seam between domain modules and the underlying
 * blob store. Today there's one implementation (LocalFsStorageService);
 * tomorrow a GcsStorageService slots in here without any caller change.
 *
 * Streams over buffers on read, so serving a 5MB header bmp doesn't
 * pull the bytes into Node's heap before sending.
 */
export interface IStorageService {
  /** Write `buffer` under `id`. Overwrites if it already exists. */
  put(id: string, buffer: Buffer): Promise<void>
  /** Stream the bytes back, or null if `id` is absent. */
  getStream(id: string): Promise<NodeJS.ReadableStream | null>
  /** Delete the bytes. Tolerant — missing id is a no-op. */
  remove(id: string): Promise<void>
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE')
