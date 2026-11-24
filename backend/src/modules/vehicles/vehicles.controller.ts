import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { DispatcherGuard } from '../auth/dispatcher.guard';
import { RoleGuard } from '../auth/role.guard';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('dispatch')
  @UseGuards(DispatcherGuard)
  getDispatchVehicles(): Promise<unknown> { return this.vehiclesService.getDispatchVehicles(); }

  @Get('mechanic/board')
  @UseGuards(RoleGuard)
  getMechanicBoard(): Promise<unknown> { return this.vehiclesService.getMechanicBoard(); }

  @Patch(':id/mechanic-status')
  @UseGuards(RoleGuard)
  setMechanicStatus(@Param('id') id: string, @Body() data: { status: string }): Promise<unknown> {
    return this.vehiclesService.setMechanicStatus(+id, data.status);
  }

  @Patch('reports/:id/resolve')
  @UseGuards(RoleGuard)
  resolveReport(@Param('id') id: string, @Body() data: { message: string; price: number }, @Req() request: any): Promise<unknown> {
    if (!data?.message?.trim() || !Number.isFinite(Number(data.price)) || Number(data.price) < 0) throw new BadRequestException('Вкажіть опис ремонту та невід’ємну ціну');
    return this.vehiclesService.resolveReport(+id, request.user.id, data.message, Number(data.price));
  }

  @Patch(':id/dispatch-status')
  @UseGuards(DispatcherGuard)
  setDispatchStatus(@Param('id') id: string, @Body() data: { status: string }): Promise<unknown> {
    return this.vehiclesService.setDispatchStatus(+id, data.status);
  }

  @Get()
  findAll(@Query() query: any): Promise<unknown> { return this.vehiclesService.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<unknown> { return this.vehiclesService.findOne(+id); }

  @Post()
  create(@Body() data: any): Promise<unknown> { return this.vehiclesService.create(data); }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any): Promise<unknown> { return this.vehiclesService.update(+id, data); }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> { return this.vehiclesService.remove(+id); }
}
