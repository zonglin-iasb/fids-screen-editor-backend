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
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    HealthModule,
    TemplatesModule,
    AssetsModule,
  ],
})
export class AppModule {}
