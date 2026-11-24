import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminSettingsService } from './admin-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin-settings')
@Controller()
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  // 1. PUBLIC ENDPOINT: Global Site Branding & Attribution
  // Consumed by Customer Storefront and Owner Portal
  @Get('platform/branding')
  @ApiOperation({ summary: 'Public: Get global platform branding, title, logos, and footer settings' })
  getPublicBranding() {
    return this.settingsService.getPublicBranding();
  }

  // 2. ADMIN ENDPOINTS: Site Branding & White-Label Configuration
  @Get('admin/settings/branding')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Get full branding and footer configuration' })
  getBranding() {
    return this.settingsService.getBranding();
  }

  @Patch('admin/settings/branding')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Update site title, logos, and footer attribution' })
  updateBranding(@Body() dto: any, @CurrentUser() user: any) {
    return this.settingsService.updateBranding(dto, user?.id || 'admin');
  }

  @Post('admin/settings/upload-logo')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Super Admin: Upload branding logo or favicon image' })
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.settingsService.uploadLogo(file);
  }

  // 3. ADMIN ENDPOINTS: Global Stripe Payment Gateway Settings
  @Get('admin/settings/stripe')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Get Stripe gateway keys (masked) and mode' })
  getStripeConfig() {
    return this.settingsService.getStripeConfig();
  }

  @Patch('admin/settings/stripe')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Update Stripe publishable/secret keys and mode' })
  updateStripeConfig(@Body() dto: any, @CurrentUser() user: any) {
    return this.settingsService.updateStripeConfig(dto, user?.id || 'admin');
  }

  @Post('admin/settings/stripe/test-connection')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Verify Stripe API connection using configured secret key' })
  testStripeConnection() {
    return this.settingsService.testStripeConnection();
  }
}
