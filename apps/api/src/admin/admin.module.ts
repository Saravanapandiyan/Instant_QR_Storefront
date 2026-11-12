import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminRestaurantsController } from './admin-restaurants.controller';
import { AdminRestaurantsService } from './admin-restaurants.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AdminDashboardController,
    AdminRestaurantsController,
    AdminUsersController,
  ],
  providers: [
    AdminDashboardService,
    AdminRestaurantsService,
    AdminUsersService,
  ],
  exports: [
    AdminDashboardService,
    AdminRestaurantsService,
    AdminUsersService,
  ],
})
export class AdminModule {}

