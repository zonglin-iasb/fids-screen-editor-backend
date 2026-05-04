import { Logger } from '@nestjs/common'
import type { Bucket } from '@google-cloud/storage'
import type { IStorageService } from './storage.service'

/**
 * GcsStorageService — IStorageService backed by a Google Cloud Storage
 * bucket. Object names are `${prefix}${id}` so the caller's id is the
 * addressable key in both LocalFs and GCS modes; the prefix only exists
 * to keep the bucket organized (e.g. `images/` vs `templates/`).
 *
 * Reads return a V4 signed URL via getReadUrl, so the API can 302 the
 * client straight to GCS rather than proxying bytes through Node. The
 * SA must have `roles/iam.serviceAccountTokenCreator` on itself for
 * signing to succeed.
 *
 * The constructor takes the bucket + prefix + ttl explicitly so one
 * Storage client can serve multiple GcsStorageService instances (one
 * per content type), each with its own prefix.
 */
export class GcsStorageService implements IStorageService {
  private readonly logger: Logger
  private readonly bucket: Bucket
  private readonly prefix: string
  private readonly signedUrlTtlSec: number

  constructor(
    bucket: Bucket,
    prefix: string,
    signedUrlTtlSec: number,
    label = 'GcsStorage',
  ) {
    this.bucket = bucket
    // Normalize: strip any leading slash, ensure exactly one trailing.
    this.prefix = prefix.replace(/^\/+/, '').replace(/\/?$/, '/')
    this.signedUrlTtlSec = signedUrlTtlSec
    this.logger = new Logger(`${GcsStorageService.name}[${label}]`)
    this.logger.log(
      `ready — bucket=${bucket.name} prefix=${this.prefix} signedUrlTtl=${this.signedUrlTtlSec}s`,
    )
  }

  async put(id: string, buffer: Buffer, mime?: string): Promise<void> {
    const file = this.bucket.file(this.objectName(id))
    await file.save(buffer, {
      resumable: false,
      contentType: mime,
    })
  }

  async getStream(id: string): Promise<NodeJS.ReadableStream | null> {
    const file = this.bucket.file(this.objectName(id))
    const [exists] = await file.exists()
    if (!exists) return null
    return file.createReadStream()
  }

  async getBuffer(id: string): Promise<Buffer | null> {
    const file = this.bucket.file(this.objectName(id))
    try {
      const [buf] = await file.download()
      return buf
    } catch (err: unknown) {
      const code = (err as { code?: number }).code
      if (code === 404) return null
      throw err
    }
  }

  async remove(id: string): Promise<void> {
    const file = this.bucket.file(this.objectName(id))
    try {
      await file.delete({ ignoreNotFound: true })
    } catch (err: unknown) {
      const code = (err as { code?: number }).code
      if (code !== 404) throw err
    }
  }

  async getReadUrl(id: string): Promise<string | null> {
    const file = this.bucket.file(this.objectName(id))
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + this.signedUrlTtlSec * 1000,
    })
    return url
  }

  getStorageRef(id: string): string {
    return `${this.bucket.name}/${this.objectName(id)}`
  }

  private objectName(id: string): string {
    return `${this.prefix}${id}`
  }
}
