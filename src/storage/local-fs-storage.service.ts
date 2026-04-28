import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createReadStream, promises as fs } from 'fs'
import * as path from 'path'
import type { IStorageService } from './storage.service'

/**
 * LocalFsStorageService — writes asset bytes to UPLOADS_DIR on the
 * local filesystem. Files are keyed by id only (no extension); the
 * mime lives in Mongo so we don't have to coordinate two sources of
 * truth on rename.
 *
 * For on-prem deployments, point UPLOADS_DIR at a mounted volume
 * (NFS, SMB) so multiple API instances share state. For cloud, swap
 * this whole class out for GcsStorageService — same interface.
 */
@Injectable()
export class LocalFsStorageService implements IStorageService {
  private readonly logger = new Logger(LocalFsStorageService.name)
  private readonly root: string
  private rootEnsured = false

  constructor(config: ConfigService) {
    const dir = config.get<string>('UPLOADS_DIR') ?? './uploads'
    this.root = path.resolve(dir)
  }

  async put(id: string, buffer: Buffer): Promise<void> {
    await this.ensureRoot()
    const target = path.join(this.root, id)
    await fs.writeFile(target, buffer)
  }

  async getStream(id: string): Promise<NodeJS.ReadableStream | null> {
    const target = path.join(this.root, id)
    try {
      await fs.access(target)
    } catch {
      return null
    }
    return createReadStream(target)
  }

  async remove(id: string): Promise<void> {
    const target = path.join(this.root, id)
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

  private async ensureRoot(): Promise<void> {
    if (this.rootEnsured) return
    await fs.mkdir(this.root, { recursive: true })
    this.rootEnsured = true
    this.logger.log(`uploads dir ready at ${this.root}`)
  }
}
