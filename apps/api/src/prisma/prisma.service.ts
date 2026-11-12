import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Connect to PostgreSQL when NestJS starts
  async onModuleInit() {
    await this.$connect();
  }

  // Gracefully close connection when NestJS shuts down
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
