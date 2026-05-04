import { Logger, Module, type Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Storage } from '@google-cloud/storage'
import * as path from 'path'
import { GcsStorageService } from './gcs-storage.service'
import { LocalFsStorageService } from './local-fs-storage.service'
import {
  ASSET_STORAGE_SERVICE,
  TEMPLATE_STORAGE_SERVICE,
  type IStorageService,
} from './storage.service'

/**
 * StorageModule — provides two named IStorageService instances:
 *
 *   ASSET_STORAGE_SERVICE     →  uploaded image bytes
 *   TEMPLATE_STORAGE_SERVICE  →  template JSON
 *
 * Each is backed by either GCS (cloud) or local FS (on-prem), chosen at
 * boot from DEPLOYMENT_MODE. In cloud mode a single Storage client and
 * Bucket are shared between the two instances; the only difference is
 * the prefix (`images/` vs `templates/`). In on-prem mode each gets its
 * own root dir on disk.
 */
@Module({
  providers: [makeProvider(ASSET_STORAGE_SERVICE, 'asset'), makeProvider(TEMPLATE_STORAGE_SERVICE, 'template')],
  exports: [ASSET_STORAGE_SERVICE, TEMPLATE_STORAGE_SERVICE],
})
export class StorageModule {}

type Kind = 'asset' | 'template'

function makeProvider(token: symbol, kind: Kind): Provider {
  return {
    provide: token,
    inject: [ConfigService],
    useFactory: (config: ConfigService): IStorageService => {
      const mode = (config.get<string>('DEPLOYMENT_MODE') ?? '')
        .trim()
        .toLowerCase()
      const isOnPrem = mode === 'on-prem' || mode === 'onprem'
      const driver = isOnPrem
        ? buildLocal(config, kind)
        : buildGcs(config, kind)
      Logger.log(
        `${kind} storage: ${driver.constructor.name} (DEPLOYMENT_MODE=${mode || 'cloud'})`,
        'StorageModule',
      )
      return driver
    },
  }
}

function buildLocal(config: ConfigService, kind: Kind): IStorageService {
  // One root dir with assets/ and templates/ subfolders, mirroring the
  // GCS bucket's prefix layout (gs://iasb/{images,templates}/).
  const root = config.get<string>('UPLOADS_DIR') ?? './uploads'
  const subdir = kind === 'asset' ? 'assets' : 'templates'
  const dir = path.join(root, subdir)
  return new LocalFsStorageService(dir, kind)
}

function buildGcs(config: ConfigService, kind: Kind): IStorageService {
  const bucketName = config.get<string>('GCS_BUCKET')
  if (!bucketName) {
    throw new Error(
      'GCS_BUCKET env var is required when DEPLOYMENT_MODE is empty (cloud mode).',
    )
  }
  const prefix =
    kind === 'asset'
      ? (config.get<string>('GCS_IMAGE_PREFIX') ?? 'images/')
      : (config.get<string>('GCS_TEMPLATE_PREFIX') ?? 'templates/')
  const signedUrlTtlSec = Number(
    config.get<string>('SIGNED_URL_TTL_SECONDS') ?? 3600,
  )

  // Storage() picks up GOOGLE_APPLICATION_CREDENTIALS from env; passing
  // keyFilename explicitly avoids surprises when something else is set.
  const keyPath = config.get<string>('GOOGLE_APPLICATION_CREDENTIALS')
  const storage = new Storage(keyPath ? { keyFilename: keyPath } : undefined)
  const bucket = storage.bucket(bucketName)
  return new GcsStorageService(bucket, prefix, signedUrlTtlSec, kind)
}
