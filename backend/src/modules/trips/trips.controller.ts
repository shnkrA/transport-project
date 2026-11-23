import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Headers, UnauthorizedException, ForbiddenException, UseGuards, BadRequestException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DispatcherGuard } from '../auth/dispatcher.guard';

@ApiTags('Рейси')
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Отримати довідник маршрутів' })
  getCatalog(): Promise<unknown> { return this.tripsService.getCatalog(); }

  @Get('overview')
  @ApiOperation({ summary: 'Отримати фактичні показники автопарку' })
  getOverview(): Promise<unknown> { return this.tripsService.getOverview(); }

  @Get('mine')
  @ApiOperation({ summary: 'Отримати рейси поточного клієнта' })
  async findMine(@Headers('authorization') authorization?: string): Promise<unknown> {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) throw new UnauthorizedException('Потрібно увійти в систему');
    let payload: { sub?: number; roleId?: number };
    try { payload = await this.jwtService.verifyAsync(token); }
    catch { throw new UnauthorizedException('Сесія завершилася. Увійдіть ще раз.'); }
    const customerId = Number(payload.sub);
    if (!Number.isInteger(customerId) || customerId < 1) throw new UnauthorizedException('Недійсний токен');
    const role = await this.usersService.getRoleName(Number(payload.roleId));
    if (role !== 'user') throw new ForbiddenException('Ця сторінка доступна клієнтам');
    return this.tripsService.findByCustomer(customerId);
  }

  @Get('driver/mine')
  @ApiOperation({ summary: 'Отримати призначені рейси поточного водія' })
  async findDriverTrips(@Headers('authorization') authorization?: string): Promise<unknown> {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) throw new UnauthorizedException('Потрібно увійти в систему');
    let payload: { sub?: number; roleId?: number };
    try { payload = await this.jwtService.verifyAsync(token); }
    catch { throw new UnauthorizedException('Сесія завершилася. Увійдіть ще раз.'); }
    const driverId = Number(payload.sub);
    if (!Number.isInteger(driverId) || driverId < 1) throw new UnauthorizedException('Недійсний токен');
    const role = await this.usersService.getRoleName(Number(payload.roleId));
    if (role !== 'driver') throw new ForbiddenException('Ця сторінка доступна водіям');
    return this.tripsService.findByDriver(driverId);
  }

  @Get('dispatch/board')
  @UseGuards(DispatcherGuard)
  @ApiOperation({ summary: 'Рейси для диспетчерської черги' })
  getDispatchBoard(@Query('status') status: 'pending' | 'confirmed' | 'in_progress'): Promise<unknown> {
    if (!['pending', 'confirmed', 'in_progress'].includes(status)) throw new BadRequestException('Доступні статуси: pending, confirmed, in_progress');
    return this.tripsService.getDispatchBoard(status);
  }

  @Get('dispatch/drivers')
  @UseGuards(DispatcherGuard)
  @ApiOperation({ summary: 'Список водіїв для призначення' })
  getDispatchDrivers(): Promise<unknown> { return this.tripsService.getDispatchDrivers(); }

  @Patch(':id/dispatch')
  @UseGuards(DispatcherGuard)
  @ApiOperation({ summary: 'Підтвердити рейс або змінити його диспетчерський статус' })
  dispatchTrip(@Param('id') id: string, @Body() data: { status?: string; driverId?: number }): Promise<unknown> {
    if (!['confirmed', 'in_progress', 'completed', 'cancelled'].includes(data?.status ?? '')) {
      throw new BadRequestException('Недійсний статус рейсу');
    }
    return this.tripsService.dispatchTrip(+id, data.status!, data.driverId);
  }

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
