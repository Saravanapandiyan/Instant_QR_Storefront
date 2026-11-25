import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HelpService } from './help.service';
import { CreateHelpArticleDto, UpdateHelpArticleDto } from './dto/help-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('help')
@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  // 1. Public / Client: Get published articles by audience (CUSTOMER or RESTAURANT)
  @Get()
  @ApiOperation({ summary: 'Get published help articles by audience' })
  async getArticles(
    @Query('audience') audience?: string,
    @Query('category') category?: string,
  ) {
    return this.helpService.getArticlesByAudience(audience, category);
  }

  // 2. Public / Client: Get article by slug
  @Get('article/:slug')
  @ApiOperation({ summary: 'Get single help article by slug' })
  async getArticleBySlug(@Param('slug') slug: string) {
    return this.helpService.getArticleBySlug(slug);
  }

  // 3. Admin: Get all articles (drafts & published)
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all articles' })
  async getAllAdmin(@Query('audience') audience?: string) {
    return this.helpService.getAllArticlesAdmin(audience);
  }

  // 4. Admin: Create article
  @Post('admin')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create help article' })
  async create(@Body() dto: CreateHelpArticleDto) {
    return this.helpService.createArticle(dto);
  }

  // 5. Admin: Update article
  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update help article' })
  async update(@Param('id') id: string, @Body() dto: UpdateHelpArticleDto) {
    return this.helpService.updateArticle(id, dto);
  }

  // 6. Admin: Delete article
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete help article' })
  async delete(@Param('id') id: string) {
    return this.helpService.deleteArticle(id);
  }
}
