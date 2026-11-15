import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Аналітика')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('report')
  @ApiOperation({ summary: 'Отримати звіт' })
  getReport(@Query() query: any) { return this.analyticsService.getReport(query); }

  @Get('fuel-stats')
  @ApiOperation({ summary: 'Статистика витрат палива' })
  getFuelStats(@Query() query: any) { return this.analyticsService.getFuelStats(query); }

  @Get('vehicle-utilization')
  @ApiOperation({ summary: 'Завантаженість ТЗ' })
  getVehicleUtilization(@Query() query: any) { return this.analyticsService.getVehicleUtilization(query); }
}
