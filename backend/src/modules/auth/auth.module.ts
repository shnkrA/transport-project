import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { DispatcherGuard } from './dispatcher.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, DispatcherGuard],
  exports: [AuthService, JwtModule, DispatcherGuard],
})
export class AuthModule {}
