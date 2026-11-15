import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Витрати палива')
@Controller('fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати записи про паливо' })
  findAll(@Query() query: any) { return this.fuelService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати запис про паливо за ID' })
  findOne(@Param('id') id: string) { return this.fuelService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити запис про паливо' })
  create(@Body() data: any) { return this.fuelService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити запис про паливо' })
  update(@Param('id') id: string, @Body() data: any) { return this.fuelService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити запис про паливо' })
  remove(@Param('id') id: string) { return this.fuelService.remove(+id); }
}
