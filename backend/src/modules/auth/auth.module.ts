import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { DispatcherGuard } from './dispatcher.guard';
import { RoleGuard } from './role.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, DispatcherGuard, RoleGuard],
  exports: [AuthService, JwtModule, DispatcherGuard, RoleGuard],
})
export class AuthModule {}
