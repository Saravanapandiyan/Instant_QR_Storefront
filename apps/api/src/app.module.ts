import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { BranchesModule } from './branches/branches.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { StorageModule } from './common/storage/storage.module';
import { ProductsModule } from './products/products.module';
import { BranchProductsModule } from './branch-products/branch-products.module';
import { AdminModule } from './admin/admin.module';
import { OrdersModule } from './orders/orders.module';
import { StaffModule } from './staff/staff.module';
import { AiModule } from './ai/ai.module';
import { PacksModule } from './packs/packs.module';
import { CreditsModule } from './credits/credits.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HelpModule } from './help/help.module';

@Module({
  imports: [
    PrismaModule,
    RestaurantsModule,
    BranchesModule,
    AuthModule,
    CategoriesModule,
    StorageModule,
    ProductsModule,
    BranchProductsModule,
    AdminModule,
    OrdersModule,
    StaffModule,
    AiModule,
    PacksModule,
    CreditsModule,
    AnalyticsModule,
    HelpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
