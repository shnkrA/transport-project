import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DispatcherGuard } from '../auth/dispatcher.guard';

@ApiTags('Транспортні засоби')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('dispatch')
  @UseGuards(DispatcherGuard)
  @ApiOperation({ summary: 'Отримати автопарк для диспетчера' })
  getDispatchVehicles(): Promise<unknown> { return this.vehiclesService.getDispatchVehicles(); }

  @Patch(':id/dispatch-status')
  @UseGuards(DispatcherGuard)
  @ApiOperation({ summary: 'Змінити стан транспорту диспетчером' })
  setDispatchStatus(@Param('id') id: string, @Body() data: { status: string }): Promise<unknown> {
    return this.vehiclesService.setDispatchStatus(+id, data.status);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати список ТЗ' })
  findAll(@Query() query: any): Promise<unknown> { return this.vehiclesService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати ТЗ за ID' })
  findOne(@Param('id') id: string): Promise<unknown> { return this.vehiclesService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити ТЗ' })
  create(@Body() data: any): Promise<unknown> { return this.vehiclesService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити ТЗ' })
  update(@Param('id') id: string, @Body() data: any): Promise<unknown> { return this.vehiclesService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити ТЗ' })
  remove(@Param('id') id: string): Promise<void> { return this.vehiclesService.remove(+id); }
}
