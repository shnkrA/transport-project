import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Рейси')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список рейсів' })
  findAll(@Query() query: any): Promise<unknown> { return this.tripsService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати рейс за ID' })
  findOne(@Param('id') id: string): Promise<unknown> { return this.tripsService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити рейс' })
  create(@Body() data: any): Promise<unknown> { return this.tripsService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити рейс' })
  update(@Param('id') id: string, @Body() data: any): Promise<unknown> { return this.tripsService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити рейс' })
  remove(@Param('id') id: string): Promise<void> { return this.tripsService.remove(+id); }
}
