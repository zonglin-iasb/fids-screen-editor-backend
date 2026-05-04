import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AssetsModule } from './assets/assets.module'
import { HealthModule } from './health/health.module'
import { TemplatesModule } from './templates/templates.module'

/**
 * AppModule — composition root. Loads .env globally, opens a Mongoose
 * connection to the local-Docker Mongo simulating on-prem, and wires
 * the health module so we can verify both the HTTP server and the DB
 * are reachable.
 *
 * Domain modules (templates, assets, renderer) plug in as siblings as
 * they get built.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Cloud and on-prem each get their own Mongo database so that
        // asset records can never reference bytes that don't exist in
        // the active storage backend. In production each deployment
        // already has its own Mongo instance, so this only matters for
        // local dev where both modes hit the same server — but the
        // override (MONGO_DB_NAME) lets prod pin an explicit name.
        const explicit = config.get<string>('MONGO_DB_NAME')
        const mode = (config.get<string>('DEPLOYMENT_MODE') ?? '')
          .trim()
          .toLowerCase()
        const isOnPrem = mode === 'on-prem' || mode === 'onprem'
        const dbName = explicit || (isOnPrem ? 'screen-editor-onprem' : 'screen-editor-cloud')
        return {
          uri: config.get<string>('MONGO_URI'),
          dbName,
        }
      },
    }),
    HealthModule,
    TemplatesModule,
    AssetsModule,
  ],
})
export class AppModule {}
