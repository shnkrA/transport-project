import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Транспортні засоби')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

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
