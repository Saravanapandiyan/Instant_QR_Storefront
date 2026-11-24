"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const credits_module_1 = require("../credits/credits.module");
const admin_dashboard_controller_1 = require("./admin-dashboard.controller");
const admin_dashboard_service_1 = require("./admin-dashboard.service");
const admin_orders_controller_1 = require("./admin-orders.controller");
const admin_orders_service_1 = require("./admin-orders.service");
const admin_restaurants_controller_1 = require("./admin-restaurants.controller");
const admin_restaurants_service_1 = require("./admin-restaurants.service");
const admin_branches_controller_1 = require("./admin-branches.controller");
const admin_branches_service_1 = require("./admin-branches.service");
const admin_dishes_controller_1 = require("./admin-dishes.controller");
const admin_dishes_service_1 = require("./admin-dishes.service");
const admin_users_controller_1 = require("./admin-users.controller");
const admin_users_service_1 = require("./admin-users.service");
const admin_settings_controller_1 = require("./admin-settings.controller");
const admin_settings_service_1 = require("./admin-settings.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, credits_module_1.CreditsModule],
        controllers: [
            admin_dashboard_controller_1.AdminDashboardController,
            admin_orders_controller_1.AdminOrdersController,
            admin_restaurants_controller_1.AdminRestaurantsController,
            admin_branches_controller_1.AdminBranchesController,
            admin_dishes_controller_1.AdminDishesController,
            admin_users_controller_1.AdminUsersController,
            admin_settings_controller_1.AdminSettingsController,
        ],
        providers: [
            admin_dashboard_service_1.AdminDashboardService,
            admin_orders_service_1.AdminOrdersService,
            admin_restaurants_service_1.AdminRestaurantsService,
            admin_branches_service_1.AdminBranchesService,
            admin_dishes_service_1.AdminDishesService,
            admin_users_service_1.AdminUsersService,
            admin_settings_service_1.AdminSettingsService,
        ],
        exports: [
            admin_dashboard_service_1.AdminDashboardService,
            admin_orders_service_1.AdminOrdersService,
            admin_restaurants_service_1.AdminRestaurantsService,
            admin_branches_service_1.AdminBranchesService,
            admin_dishes_service_1.AdminDishesService,
            admin_users_service_1.AdminUsersService,
            admin_settings_service_1.AdminSettingsService,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map