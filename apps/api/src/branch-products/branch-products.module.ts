import { Module } from '@nestjs/common';
import { BranchProductsService } from './branch-products.service';
import { BranchProductsController } from './branch-products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BranchProductsController],
  providers: [BranchProductsService],
  exports: [BranchProductsService],
})
export class BranchProductsModule {}
