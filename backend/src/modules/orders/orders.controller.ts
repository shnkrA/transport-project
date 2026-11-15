import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Замовлення')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список замовлень' })
  findAll(@Query() query: any) { return this.ordersService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати замовлення за ID' })
  findOne(@Param('id') id: string) { return this.ordersService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити замовлення' })
  create(@Body() data: any) { return this.ordersService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити замовлення' })
  update(@Param('id') id: string, @Body() data: any) { return this.ordersService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити замовлення' })
  remove(@Param('id') id: string) { return this.ordersService.remove(+id); }
}
