import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ForbiddenException, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { TripsService } from './trips.service';
import { DispatcherGuard } from '../auth/dispatcher.guard';
import { RoleGuard } from '../auth/role.guard';
import { SessionService } from '../auth/session.service';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly sessions: SessionService,
  ) {}

  @Get('catalog')
  getCatalog(): Promise<unknown> { return this.tripsService.getCatalog(); }

  @Get('overview')
  getOverview(): Promise<unknown> { return this.tripsService.getOverview(); }

  @Get('mine')
  async findMine(@Req() request: any): Promise<unknown> {
    const user = await this.sessions.requireUser(request);
    if (user.role !== 'user') throw new ForbiddenException('Ця сторінка доступна клієнтам');
    return this.tripsService.findByCustomer(user.id);
  }

  @Get('driver/mine')
  @UseGuards(RoleGuard)
  async findDriverTrips(@Req() request: any): Promise<unknown> {
    return this.tripsService.findByDriver(request.user.id);
  }

  @Patch(':id/driver-status')
  @UseGuards(RoleGuard)
  driverStatus(@Param('id') id: string, @Body() data: { status: string }, @Req() request: any): Promise<unknown> {
    if (!['in_progress', 'completed'].includes(data?.status ?? '')) throw new BadRequestException('Недійсний статус рейсу');
    return this.tripsService.driverStatus(+id, request.user.id, data.status as 'in_progress' | 'completed');
  }

  @Post(':id/report')
  @UseGuards(RoleGuard)
  report(@Param('id') id: string, @Body() data: { type: string; message?: string }, @Req() request: any): Promise<unknown> {
    if (data?.type !== 'breakdown') throw new BadRequestException('Доступне лише повідомлення про поломку');
    return this.tripsService.createDriverReport(+id, request.user.id, data.type, data.message ?? '');
  }

  @Get('dispatch/board')
  @UseGuards(DispatcherGuard)
  getDispatchBoard(@Query('status') status: 'pending' | 'confirmed' | 'in_progress'): Promise<unknown> {
    if (!['pending', 'confirmed', 'in_progress'].includes(status)) throw new BadRequestException('Доступні статуси: pending, confirmed, in_progress');
    return this.tripsService.getDispatchBoard(status);
  }

  @Get('dispatch/drivers')
  @UseGuards(DispatcherGuard)
  getDispatchDrivers(): Promise<unknown> { return this.tripsService.getDispatchDrivers(); }

  @Patch(':id/dispatch')
  @UseGuards(DispatcherGuard)
  dispatchTrip(@Param('id') id: string, @Body() data: { status?: string; driverId?: number }): Promise<unknown> {
    if (!['confirmed', 'in_progress', 'completed', 'cancelled'].includes(data?.status ?? '')) {
      throw new BadRequestException('Недійсний статус рейсу');
    }
    return this.tripsService.dispatchTrip(+id, data.status!, data.driverId);
  }

  @Get()
  findAll(@Query() query: any): Promise<unknown> { return this.tripsService.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<unknown> { return this.tripsService.findOne(+id); }

  @Post()
  create(@Body() data: any): Promise<unknown> { return this.tripsService.create(data); }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any): Promise<unknown> { return this.tripsService.update(+id, data); }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> { return this.tripsService.remove(+id); }
}
