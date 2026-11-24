import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PacksService } from './packs.service';
import { PacksController } from './packs.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PacksController],
  providers: [PacksService],
  exports: [PacksService],
})
export class PacksModule {}
