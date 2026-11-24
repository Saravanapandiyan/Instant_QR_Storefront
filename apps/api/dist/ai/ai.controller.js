"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const ai_service_1 = require("./ai.service");
const ai_dto_1 = require("./dto/ai.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async parseMenu(file, imageBase64, mimeType) {
        if (file) {
            return this.aiService.parseMenuImage(file.buffer, file.mimetype);
        }
        if (imageBase64) {
            const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            return this.aiService.parseMenuImage(buffer, mimeType || 'image/jpeg');
        }
        throw new common_1.BadRequestException('Please provide a menu image file or imageBase64 data');
    }
    async generateDescription(dto) {
        const description = await this.aiService.generateDishDescription(dto.dishName, dto.categoryName);
        return { success: true, description };
    }
    async findImage(dto) {
        const result = await this.aiService.findDishImage(dto.dishName);
        return { success: true, ...result };
    }
    async quickSetup(user, dto) {
        return this.aiService.executeQuickSetup(user.id, dto);
    }
    async bulkImport(restaurantId, categories) {
        if (!restaurantId || !categories || !Array.isArray(categories)) {
            throw new common_1.BadRequestException('restaurantId and categories array are required');
        }
        return this.aiService.bulkImportMenu(restaurantId, categories);
    }
    getSupportedLanguages() {
        return this.aiService.getSupportedLanguages();
    }
    async translateMenu(dto) {
        if (!dto.restaurantId || !dto.targetLanguages || dto.targetLanguages.length === 0) {
            throw new common_1.BadRequestException('restaurantId and targetLanguages are required');
        }
        return this.aiService.translateMenu(dto.restaurantId, dto.targetLanguages);
    }
    async updateProductTranslation(productId, dto) {
        return this.aiService.updateProductTranslation(productId, dto.langCode, dto.name, dto.description);
    }
    async updateCategoryTranslation(categoryId, dto) {
        return this.aiService.updateCategoryTranslation(categoryId, dto.langCode, dto.name, dto.description);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('menu-import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Extract categories, dishes, prices, descriptions, and images from menu photo/PDF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Menu parsed and enriched successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('imageBase64')),
    __param(2, (0, common_1.Body)('mimeType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "parseMenu", null);
__decorate([
    (0, common_1.Post)('generate-description'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a 1-sentence mouth-watering food description via Gemini AI' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.GenerateDescriptionDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateDescription", null);
__decorate([
    (0, common_1.Post)('dish-image'),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-find dish photo via Unsplash or AI fallback' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.SearchDishImageDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "findImage", null);
__decorate([
    (0, common_1.Post)('quick-setup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Execute atomic 5-minute setup (Restaurant + 100 Credits + Branch + Categories + Dishes + Staff PIN)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_dto_1.QuickSetupDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "quickSetup", null);
__decorate([
    (0, common_1.Post)('bulk-import-menu'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk import dishes & categories into an existing restaurant concept' }),
    __param(0, (0, common_1.Body)('restaurantId')),
    __param(1, (0, common_1.Body)('categories')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)('supported-languages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of supported languages with regional metadata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getSupportedLanguages", null);
__decorate([
    (0, common_1.Post)('translate-menu'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Translate all dishes and categories using Gemini AI into selected regional languages' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.TranslateMenuDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "translateMenu", null);
__decorate([
    (0, common_1.Put)('translation/product/:productId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Manually edit or override a dish translation' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_dto_1.UpdateTranslationDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "updateProductTranslation", null);
__decorate([
    (0, common_1.Put)('translation/category/:categoryId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Manually edit or override a category translation' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_dto_1.UpdateTranslationDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "updateCategoryTranslation", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI & Quick Setup'),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map