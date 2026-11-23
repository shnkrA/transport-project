import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { DispatcherGuard } from '../auth/dispatcher.guard';
import { RoleGuard } from '../auth/role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Trip]), AuthModule, UsersModule],
  controllers: [TripsController],
  providers: [TripsService, DispatcherGuard, RoleGuard],
  exports: [TripsService],
})
export class TripsModule {}
