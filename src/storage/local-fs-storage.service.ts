import { Logger } from '@nestjs/common'
import { createReadStream, promises as fs } from 'fs'
import * as path from 'path'
import type { IStorageService } from './storage.service'

/**
 * LocalFsStorageService — writes bytes to a configurable root dir on
 * the local filesystem. Files are keyed by id only (no extension); any
 * mime / format info lives in the caller's metadata layer.
 *
 * The constructor takes the root dir explicitly so the same class can
 * be instantiated twice (one root for assets, one for templates) by
 * StorageModule's factory.
 *
 * For multi-instance on-prem deployments, point the root at a mounted
 * shared volume (NFS, SMB) so all API instances see the same bytes.
 */
export class LocalFsStorageService implements IStorageService {
  private readonly logger: Logger
  private readonly root: string
  /** Original input rootDir, normalized for use in `getStorageRef`.
   *  Resolves a clean path-like ref (`uploads/assets/<id>`) without
   *  leaking the absolute filesystem path into Mongo. */
  private readonly refRoot: string
  private rootEnsured = false

  constructor(rootDir: string, label = 'LocalFsStorage') {
    this.root = path.resolve(rootDir)
    this.refRoot = rootDir
      .replace(/^\.\//, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
    this.logger = new Logger(`${LocalFsStorageService.name}[${label}]`)
  }

  async put(id: string, buffer: Buffer, _mime?: string): Promise<void> {
    await this.ensureRoot()
    const target = this.targetPath(id)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, buffer)
  }

  async getStream(id: string): Promise<NodeJS.ReadableStream | null> {
    const target = this.targetPath(id)
    try {
      await fs.access(target)
    } catch {
      return null
    }
    return createReadStream(target)
  }

  async getBuffer(id: string): Promise<Buffer | null> {
    const target = this.targetPath(id)
    try {
      return await fs.readFile(target)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw err
    }
  }

  /** No redirect — the controller falls back to streaming via getStream. */
  async getReadUrl(_id: string): Promise<string | null> {
    return null
  }

  getStorageRef(id: string): string {
    return `${this.refRoot}/${id}`
  }

  async remove(id: string): Promise<void> {
    const target = this.targetPath(id)
    try {
      await fs.unlink(target)
    } catch (err) {
      // ENOENT is fine — the meta record was the source of truth and
      // we're just cleaning up after it.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
    }
  }

  private targetPath(id: string): string {
    return path.join(this.root, id)
  }

  private async ensureRoot(): Promise<void> {
    if (this.rootEnsured) return
    await fs.mkdir(this.root, { recursive: true })
    this.rootEnsured = true
    this.logger.log(`storage root ready at ${this.root}`)
  }
}
