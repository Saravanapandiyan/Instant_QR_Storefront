import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BootstrapSuperAdminDto } from './dto/bootstrap-super-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new restaurant owner account' })
  @ApiResponse({ status: 201, description: 'Account registered successfully.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login to restaurant owner account' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Returns current authenticated user.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token.' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (name, email, phone)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  // =========================================================================
  // DEDICATED SUPER ADMIN & PLATFORM CONTROL PLANE ENDPOINTS
  // =========================================================================

  @Get('admin/status')
  @ApiOperation({ summary: 'Check if platform has an initialized Super Admin' })
  @ApiResponse({ status: 200, description: 'Returns bootstrap availability status.' })
  getAdminStatus() {
    return this.authService.getAdminStatus();
  }

  @Post('admin/bootstrap')
  @ApiOperation({ summary: 'Bootstrap initial Super Admin or add with setup secret' })
  @ApiResponse({ status: 201, description: 'Super Admin created successfully, returns JWT.' })
  @ApiResponse({ status: 403, description: 'Bootstrap locked; invalid setup key.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  bootstrapSuperAdmin(@Body() dto: BootstrapSuperAdminDto) {
    return this.authService.bootstrapSuperAdmin(dto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Dedicated Super Admin login for Platform Control Plane' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @ApiResponse({ status: 403, description: 'Access denied: User is not a Super Admin.' })
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }
}
