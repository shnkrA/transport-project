import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { GpsService } from './gps.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('GPS-трекінг')
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('update')
  @ApiOperation({ summary: 'Оновити GPS-координати' })
  updatePosition(@Body() data: { vehicleId: number; latitude: number; longitude: number; speed?: number }) {
    return this.gpsService.updatePosition(data);
  }

  @Get(':vehicleId')
  @ApiOperation({ summary: 'Отримати поточну позицію ТЗ' })
  getCurrentPosition(@Param('vehicleId') vehicleId: string) {
    return this.gpsService.getCurrentPosition(+vehicleId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Історія GPS-координат' })
  getHistory(@Query() query: { vehicleId: number; from: string; to: string }) {
    return this.gpsService.getHistory(query);
  }
}
