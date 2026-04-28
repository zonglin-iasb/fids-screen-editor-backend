import { Controller, Get } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'

/**
 * Health probe — returns server status + Mongo connection state. Useful
 * for verifying the backend is up and the DB is reachable before the
 * editor starts hitting domain endpoints.
 *
 * Mongoose readyState values:
 *   0 disconnected, 1 connected, 2 connecting, 3 disconnecting
 */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting']
    const state = this.connection.readyState
    return {
      status: 'ok',
      uptime: process.uptime(),
      db: {
        state: dbStates[state] ?? 'unknown',
        name: this.connection.name ?? null,
      },
      timestamp: new Date().toISOString(),
    }
  }
}
