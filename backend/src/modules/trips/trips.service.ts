import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { Trip } from '../../entities/trip.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly tripsRepository: Repository<Trip>,
    private readonly dataSource: DataSource,
  ) {}

  async getCatalog(): Promise<any> {
    const [routes, drivers] = await Promise.all([this.dataSource.query(
      `SELECT id, origin, destination, transport_type AS "transportType",
              distance_km AS "distanceKm", duration_minutes AS "durationMinutes",
              train_number AS "trainNumber", departure_time AS "departureTime",
              source_url AS "sourceUrl"
       FROM route_catalog WHERE is_active = TRUE ORDER BY origin, destination, transport_type`,
    ), this.dataSource.query(
      `SELECT first_name AS "firstName", last_name AS "lastName"
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'driver' AND u.is_active = TRUE ORDER BY u.id LIMIT 1`,
    )]);
    return { routes, driver: drivers[0] ?? null };
  }

  getDispatchBoard(status: 'pending' | 'confirmed' | 'in_progress'): Promise<any[]> {
    return this.dataSource.query(
      `SELECT t.*, v.vehicle_type AS "vehicleType", v.model AS "vehicleModel",
              v.license_plate AS "licensePlate", v.status AS "vehicleStatus",
              c.first_name AS "customerFirstName", c.last_name AS "customerLastName",
              d.first_name AS "driverFirstName", d.last_name AS "driverLastName"
       FROM trips t
       JOIN vehicles v ON v.id = t.vehicle_id
       LEFT JOIN users c ON c.id = t.customer_id
       LEFT JOIN users d ON d.id = t.driver_id
       WHERE t.status = $1
       ORDER BY t.departure_time ASC NULLS LAST, t.created_at ASC`,
      [status],
    );
  }

  async getDispatchDrivers(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email,
              EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = u.id AND t.status = 'in_progress') AS "inTrip"
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'driver' AND u.is_active = TRUE
       ORDER BY u.last_name, u.first_name`,
    );
  }

  async dispatchTrip(id: number, status: string, requestedDriverId?: number): Promise<any> {
    const trip = await this.findOne(id);
    const allowedNext: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
    };
    if (!allowedNext[trip.status]?.includes(status)) {
      throw new ConflictException(`Не можна змінити статус рейсу з ${trip.status} на ${status}`);
    }

    const [vehicle] = await this.dataSource.query(
      'SELECT id, vehicle_type AS "vehicleType", status FROM vehicles WHERE id = $1', [trip.vehicleId],
    );
    if (!vehicle) throw new NotFoundException('Транспорт рейсу не знайдено');
    let driverId = requestedDriverId ?? trip.driverId ?? null;
    if (vehicle.vehicleType === 'train') {
      if (requestedDriverId) throw new BadRequestException('Для залізничного рейсу водій не призначається');
      driverId = null;
    } else if (['confirmed', 'in_progress'].includes(status)) {
      if (!driverId) throw new BadRequestException('Для автобусного рейсу спочатку призначте водія');
      const [driver] = await this.dataSource.query(
        `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND r.name = 'driver' AND u.is_active = TRUE`, [driverId],
      );
      if (!driver) throw new BadRequestException('Оберіть активного користувача з роллю водія');
      if (trip.departureTime) {
        const [conflict] = await this.dataSource.query(
          `SELECT id FROM trips WHERE driver_id = $1 AND id <> $2
             AND status IN ('confirmed', 'in_progress')
             AND departure_time::date = $3::date LIMIT 1`,
          [driverId, id, trip.departureTime],
        );
        if (conflict) throw new ConflictException('Водій уже призначений на інший рейс цього дня');
      }
    }
    if (['confirmed', 'in_progress'].includes(status) && vehicle.status !== 'available') {
      throw new ConflictException('Транспорт зараз недоступний або перебуває на техобслуговуванні');
    }
    if (status === 'confirmed' && trip.departureTime) {
      const [vehicleConflict] = await this.dataSource.query(
        `SELECT id FROM trips WHERE vehicle_id = $1 AND id <> $2
           AND status IN ('confirmed', 'in_progress')
           AND departure_time::date = $3::date LIMIT 1`,
        [trip.vehicleId, id, trip.departureTime],
      );
      if (vehicleConflict) throw new ConflictException('Транспорт уже призначений на інший рейс цього дня');
    }
    if (status === 'in_progress') {
      const [conflict] = await this.dataSource.query(
        `SELECT id FROM trips WHERE vehicle_id = $1 AND id <> $2 AND status = 'in_progress' LIMIT 1`,
        [trip.vehicleId, id],
      );
      if (conflict) throw new ConflictException('Цей транспорт уже виконує інший рейс');
    }

    trip.driverId = driverId ?? undefined;
    trip.status = status;
    const saved = await this.tripsRepository.save(trip);
    if (status === 'in_progress') await this.dataSource.query("UPDATE vehicles SET status = 'in_trip', updated_at = NOW() WHERE id = $1", [trip.vehicleId]);
    if (status === 'completed') await this.dataSource.query("UPDATE vehicles SET status = 'available', updated_at = NOW() WHERE id = $1 AND status = 'in_trip'", [trip.vehicleId]);
    if (status === 'cancelled' && trip.driverId) trip.driverId = undefined;
    return saved;
  }

  async findAll(query?: any): Promise<Trip[]> { return this.tripsRepository.find(); }
  findByCustomer(customerId: number): Promise<any[]> {
    return this.dataSource.query(
      `SELECT t.*, v.vehicle_type AS "vehicleType", v.model AS "vehicleModel",
              v.license_plate AS "licensePlate"
       FROM trips t LEFT JOIN vehicles v ON v.id = t.vehicle_id
       WHERE t.customer_id = $1
       ORDER BY t.departure_time ASC NULLS LAST, t.created_at DESC`,
      [customerId],
    );
  }
  async findOne(id: number): Promise<Trip> {
    const item = await this.tripsRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Рейс з ID ${id} не знайдено`);
    return item;
  }
  async create(data: any): Promise<Trip> { return this.tripsRepository.save(data); }
  async update(id: number, data: any): Promise<Trip> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.tripsRepository.save(item);
  }
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.tripsRepository.remove(item);
  }
}
