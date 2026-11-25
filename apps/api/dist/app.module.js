"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const restaurants_module_1 = require("./restaurants/restaurants.module");
const branches_module_1 = require("./branches/branches.module");
const auth_module_1 = require("./auth/auth.module");
const categories_module_1 = require("./categories/categories.module");
const storage_module_1 = require("./common/storage/storage.module");
const products_module_1 = require("./products/products.module");
const branch_products_module_1 = require("./branch-products/branch-products.module");
const admin_module_1 = require("./admin/admin.module");
const orders_module_1 = require("./orders/orders.module");
const staff_module_1 = require("./staff/staff.module");
const ai_module_1 = require("./ai/ai.module");
const packs_module_1 = require("./packs/packs.module");
const credits_module_1 = require("./credits/credits.module");
const analytics_module_1 = require("./analytics/analytics.module");
const help_module_1 = require("./help/help.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            restaurants_module_1.RestaurantsModule,
            branches_module_1.BranchesModule,
            auth_module_1.AuthModule,
            categories_module_1.CategoriesModule,
            storage_module_1.StorageModule,
            products_module_1.ProductsModule,
            branch_products_module_1.BranchProductsModule,
            admin_module_1.AdminModule,
            orders_module_1.OrdersModule,
            staff_module_1.StaffModule,
            ai_module_1.AiModule,
            packs_module_1.PacksModule,
            credits_module_1.CreditsModule,
            analytics_module_1.AnalyticsModule,
            help_module_1.HelpModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map