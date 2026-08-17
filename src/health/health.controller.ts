import { Controller, Get, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [postgres, redis] = await Promise.all([
      this.dataSource
        .query('SELECT 1')
        .then(() => 'up')
        .catch(() => 'down'),
      this.redis
        .ping()
        .then(() => 'up')
        .catch(() => 'down'),
    ]);

    return { postgres, redis };
  }
}
