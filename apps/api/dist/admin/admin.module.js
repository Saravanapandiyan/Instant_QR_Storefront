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
const admin_dashboard_controller_1 = require("./admin-dashboard.controller");
const admin_dashboard_service_1 = require("./admin-dashboard.service");
const admin_restaurants_controller_1 = require("./admin-restaurants.controller");
const admin_restaurants_service_1 = require("./admin-restaurants.service");
const admin_users_controller_1 = require("./admin-users.controller");
const admin_users_service_1 = require("./admin-users.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [
            admin_dashboard_controller_1.AdminDashboardController,
            admin_restaurants_controller_1.AdminRestaurantsController,
            admin_users_controller_1.AdminUsersController,
        ],
        providers: [
            admin_dashboard_service_1.AdminDashboardService,
            admin_restaurants_service_1.AdminRestaurantsService,
            admin_users_service_1.AdminUsersService,
        ],
        exports: [
            admin_dashboard_service_1.AdminDashboardService,
            admin_restaurants_service_1.AdminRestaurantsService,
            admin_users_service_1.AdminUsersService,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map