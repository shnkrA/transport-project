import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { DispatcherGuard } from './dispatcher.guard';
import { RoleGuard } from './role.guard';
import { SessionService } from './session.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, DispatcherGuard, RoleGuard],
  exports: [AuthService, SessionService, DispatcherGuard, RoleGuard],
})
export class AuthModule {}
