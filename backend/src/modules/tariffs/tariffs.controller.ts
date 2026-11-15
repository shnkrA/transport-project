import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Тарифи')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список тарифів' })
  findAll(@Query() query: any) { return this.tariffsService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати тариф за ID' })
  findOne(@Param('id') id: string) { return this.tariffsService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити тариф' })
  create(@Body() data: any) { return this.tariffsService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити тариф' })
  update(@Param('id') id: string, @Body() data: any) { return this.tariffsService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити тариф' })
  remove(@Param('id') id: string) { return this.tariffsService.remove(+id); }
}
