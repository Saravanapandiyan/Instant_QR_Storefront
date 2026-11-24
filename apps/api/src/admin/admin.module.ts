import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminRestaurantsController } from './admin-restaurants.controller';
import { AdminRestaurantsService } from './admin-restaurants.service';
import { AdminBranchesController } from './admin-branches.controller';
import { AdminBranchesService } from './admin-branches.service';
import { AdminDishesController } from './admin-dishes.controller';
import { AdminDishesService } from './admin-dishes.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  imports: [PrismaModule, AuthModule, CreditsModule],
  controllers: [
    AdminDashboardController,
    AdminOrdersController,
    AdminRestaurantsController,
    AdminBranchesController,
    AdminDishesController,
    AdminUsersController,
    AdminSettingsController,
  ],
  providers: [
    AdminDashboardService,
    AdminOrdersService,
    AdminRestaurantsService,
    AdminBranchesService,
    AdminDishesService,
    AdminUsersService,
    AdminSettingsService,
  ],
  exports: [
    AdminDashboardService,
    AdminOrdersService,
    AdminRestaurantsService,
    AdminBranchesService,
    AdminDishesService,
    AdminUsersService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
