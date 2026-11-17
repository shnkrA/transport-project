import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('ТО та ремонти')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список замовлень на ТО' })
  findAll(@Query() query: any): Promise<unknown> { return this.maintenanceService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати замовлення на ТО за ID' })
  findOne(@Param('id') id: string): Promise<unknown> { return this.maintenanceService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити замовлення на ТО' })
  create(@Body() data: any): Promise<unknown> { return this.maintenanceService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити замовлення на ТО' })
  update(@Param('id') id: string, @Body() data: any): Promise<unknown> { return this.maintenanceService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити замовлення на ТО' })
  remove(@Param('id') id: string): Promise<void> { return this.maintenanceService.remove(+id); }
}
