import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Водії')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список водіїв' })
  findAll(@Query() query: any) { return this.driversService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати водія за ID' })
  findOne(@Param('id') id: string) { return this.driversService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити водія' })
  create(@Body() data: any) { return this.driversService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити водія' })
  update(@Param('id') id: string, @Body() data: any) { return this.driversService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити водія' })
  remove(@Param('id') id: string) { return this.driversService.remove(+id); }
}
