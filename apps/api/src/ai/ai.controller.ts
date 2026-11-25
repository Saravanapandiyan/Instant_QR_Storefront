import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  QuickSetupDto,
  GenerateDescriptionDto,
  SearchDishImageDto,
  TranslateMenuDto,
  UpdateTranslationDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI & Quick Setup')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('menu-import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 30 * 1024 * 1024 }, // Up to 30MB for high-res camera photos
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Extract categories, dishes, prices, descriptions, and images from menu photo/PDF' })
  @ApiResponse({ status: 200, description: 'Menu parsed and enriched successfully' })
  async parseMenu(
    @UploadedFile() file?: Express.Multer.File,
    @Body('imageBase64') imageBase64?: string,
    @Body('mimeType') mimeType?: string,
  ) {
    if (file) {
      return this.aiService.parseMenuImage(file.buffer, file.mimetype);
    }

    if (imageBase64) {
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      return this.aiService.parseMenuImage(buffer, mimeType || 'image/jpeg');
    }

    throw new BadRequestException('Please provide a menu image file or imageBase64 data');
  }

  @Post('generate-description')
  @ApiOperation({ summary: 'Generate a 1-sentence mouth-watering food description via Gemini AI' })
  async generateDescription(@Body() dto: GenerateDescriptionDto) {
    const description = await this.aiService.generateDishDescription(
      dto.dishName,
      dto.categoryName,
    );
    return { success: true, description };
  }

  @Post('dish-image')
  @ApiOperation({ summary: 'Auto-find dish photo via Unsplash or AI fallback' })
  async findImage(@Body() dto: SearchDishImageDto) {
    const result = await this.aiService.findDishImage(dto.dishName);
    return { success: true, ...result };
  }

  @Post('quick-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute atomic 5-minute setup (Restaurant + 100 Credits + Branch + Categories + Dishes + Staff PIN)' })
  async quickSetup(@CurrentUser() user: any, @Body() dto: QuickSetupDto) {
    return this.aiService.executeQuickSetup(user.id, dto);
  }

  @Post('bulk-import-menu')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk import dishes & categories into an existing restaurant concept' })
  async bulkImport(
    @Body('restaurantId') restaurantId: string,
    @Body('categories') categories: any[],
  ) {
    if (!restaurantId || !categories || !Array.isArray(categories)) {
      throw new BadRequestException('restaurantId and categories array are required');
    }
    return this.aiService.bulkImportMenu(restaurantId, categories);
  }

  // ==========================================
  // Multilingual Menu Translation Endpoints
  // ==========================================
  @Get('supported-languages')
  @ApiOperation({ summary: 'Get list of supported languages with regional metadata' })
  getSupportedLanguages() {
    return this.aiService.getSupportedLanguages();
  }

  @Post('languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a custom language to the platform' })
  async addLanguage(@Body() dto: { code: string; name: string; nativeName: string; flag?: string; direction?: string }) {
    return this.aiService.addCustomLanguage(dto);
  }

  @Delete('languages/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a custom language' })
  async deleteLanguage(@Param('code') code: string) {
    return this.aiService.deleteCustomLanguage(code);
  }

  @Post('translate-menu')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Translate all dishes and categories using Gemini AI into selected regional languages' })
  async translateMenu(@Body() dto: TranslateMenuDto) {
    if (!dto.restaurantId || !dto.targetLanguages || dto.targetLanguages.length === 0) {
      throw new BadRequestException('restaurantId and targetLanguages are required');
    }
    return this.aiService.translateMenu(dto.restaurantId, dto.targetLanguages);
  }

  @Put('translation/product/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually edit or override a dish translation' })
  async updateProductTranslation(
    @Param('productId') productId: string,
    @Body() dto: UpdateTranslationDto,
  ) {
    return this.aiService.updateProductTranslation(
      productId,
      dto.langCode,
      dto.name,
      dto.description,
    );
  }

  @Put('translation/category/:categoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually edit or override a category translation' })
  async updateCategoryTranslation(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateTranslationDto,
  ) {
    return this.aiService.updateCategoryTranslation(
      categoryId,
      dto.langCode,
      dto.name,
      dto.description,
    );
  }
}
