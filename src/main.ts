import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

/**
 * Bootstrap — boots the Nest app, reads PORT and CORS_ORIGINS from env,
 * and exposes the listening port so the editor (Vite) can target it.
 *
 * No global prefix yet; we'll add `/api` once the editor is wired up
 * and we want to avoid collisions with future Vite proxy rules.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  const port = Number(config.get<string>('PORT') ?? 3001)
  await app.listen(port)
  Logger.log(`fids-screen-editor-backend listening on http://localhost:${port}`, 'Bootstrap')
}

void bootstrap()
