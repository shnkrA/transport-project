import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from '../../entities/vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { DispatcherGuard } from '../auth/dispatcher.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle]), AuthModule, UsersModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, DispatcherGuard],
  exports: [VehiclesService],
})
export class VehiclesModule {}
