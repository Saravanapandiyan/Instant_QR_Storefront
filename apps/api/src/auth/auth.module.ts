import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'instant-qr-dev-secret-key-change-in-production-2026',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN as any) ?? '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, SuperAdminGuard],
  exports: [AuthService, JwtAuthGuard, SuperAdminGuard, PassportModule, JwtModule],
})
export class AuthModule {}
