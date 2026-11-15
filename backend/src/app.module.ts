import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from './config/database.config';

// Модулі додатку
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TripsModule } from './modules/trips/trips.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { GpsModule } from './modules/gps/gps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'transport_user'),
        password: configService.get('DB_PASSWORD', 'transport_password'),
        database: configService.get('DB_NAME', 'transport_db'),
        autoLoadEntities: true,
        synchronize: configService.get('DB_SYNC', false),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    VehiclesModule,
    DriversModule,
    OrdersModule,
    TripsModule,
    MaintenanceModule,
    FuelModule,
    DocumentsModule,
    AnalyticsModule,
    TariffsModule,
    GpsModule,
  ],
})
export class AppModule {}
