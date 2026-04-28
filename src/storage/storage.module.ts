import { Module } from '@nestjs/common'
import { LocalFsStorageService } from './local-fs-storage.service'
import { STORAGE_SERVICE } from './storage.service'

/**
 * StorageModule — provides a single IStorageService implementation,
 * picked by the runtime. Today it's always local FS; later this will
 * branch on env (e.g. STORAGE_DRIVER=gcs) to swap in GcsStorageService.
 */
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: LocalFsStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
