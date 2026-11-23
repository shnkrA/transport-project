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
    const routes = await this.dataSource.query(
      `SELECT id, origin, destination, transport_type AS "transportType",
              distance_km AS "distanceKm", duration_minutes AS "durationMinutes",
              train_number AS "trainNumber", departure_time AS "departureTime",
              source_url AS "sourceUrl"
       FROM route_catalog WHERE is_active = TRUE ORDER BY origin, destination, transport_type`,
    );
    return { routes };
  }

  async getOverview(): Promise<any> {
    const [counts, fleet, recentTrips, activity] = await Promise.all([
      this.dataSource.query(
        `SELECT
           (SELECT COUNT(*) FROM trips WHERE departure_time::date = CURRENT_DATE)::int AS "tripsToday",
           (SELECT COUNT(*) FROM trips WHERE status = 'in_progress')::int AS "tripsInProgress",
           (SELECT COUNT(*) FROM vehicles WHERE status = 'available')::int AS "availableVehicles",
           (SELECT COUNT(*) FROM vehicles WHERE status IN ('maintenance', 'out_of_service'))::int AS "vehiclesNeedingAttention"`,
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'in_trip')::int AS "inTrip",
           COUNT(*) FILTER (WHERE status = 'available')::int AS available,
           COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance,
           COUNT(*) FILTER (WHERE status = 'out_of_service')::int AS "outOfService"
         FROM vehicles`,
      ),
      this.dataSource.query(
        `SELECT t.id, t.departure_point AS "departurePoint", t.arrival_point AS "arrivalPoint",
                t.departure_time AS "departureTime", t.status,
                d.first_name AS "driverFirstName", d.last_name AS "driverLastName",
                v.vehicle_type AS "vehicleType", v.model AS "vehicleModel"
         FROM trips t
         LEFT JOIN users d ON d.id = t.driver_id
         LEFT JOIN vehicles v ON v.id = t.vehicle_id
         ORDER BY t.departure_time DESC NULLS LAST, t.created_at DESC
         LIMIT 5`,
      ),
      this.dataSource.query(
        `SELECT days.day::date AS date,
           COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed,
           COUNT(t.id) FILTER (WHERE t.status IN ('pending', 'confirmed', 'in_progress'))::int AS scheduled
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS days(day)
         LEFT JOIN trips t ON t.departure_time::date = days.day::date
         GROUP BY days.day ORDER BY days.day`,
      ),
    ]);
    return { counts: counts[0], fleet: fleet[0], recentTrips, activity };
  }

  getDispatchBoard(status: 'pending' | 'confirmed' | 'in_progress'): Promise<any[]> {
    return this.dataSource.query(
      `SELECT t.*, t.route_distance_km AS "routeDistanceKm", v.vehicle_type AS "vehicleType", v.model AS "vehicleModel",
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

  async driverStatus(id: number, driverId: number, status: 'in_progress' | 'completed'): Promise<any> {
    const trip = await this.findOne(id);
    if (Number(trip.driverId) !== driverId) throw new ConflictException('Цей рейс не призначений вам');
    const expected = status === 'in_progress' ? 'confirmed' : 'in_progress';
    if (trip.status !== expected) throw new ConflictException(`Не можна змінити статус рейсу з ${trip.status}`);
    const vehicle = await this.dataSource.query('SELECT vehicle_type FROM vehicles WHERE id = $1', [trip.vehicleId]);
    if (!vehicle[0] || vehicle[0].vehicle_type === 'train') throw new BadRequestException('Водій може керувати лише автобусними рейсами');
    trip.status = status;
    const saved = await this.tripsRepository.save(trip);
    await this.dataSource.query('UPDATE vehicles SET status = $1, updated_at = NOW() WHERE id = $2', [status === 'in_progress' ? 'in_trip' : 'available', trip.vehicleId]);
    return saved;
  }

  async createDriverReport(tripId: number, driverId: number, type: string, message: string): Promise<any> {
    const trip = await this.findOne(tripId);
    if (Number(trip.driverId) !== driverId || trip.status !== 'in_progress') throw new ConflictException('Повідомлення можна надіслати лише для свого рейсу в дорозі');
    const [report] = await this.dataSource.query(
      `INSERT INTO driver_reports (trip_id, vehicle_id, driver_id, type, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, trip_id AS "tripId", vehicle_id AS "vehicleId", type, message, status, created_at AS "createdAt"`,
      [tripId, trip.vehicleId, driverId, type, message.trim() || (type === 'breakdown' ? 'Потрібен огляд механіка' : 'Повідомлення про затримку')],
    );
    if (type === 'breakdown') await this.dataSource.query("UPDATE vehicles SET status = 'maintenance', updated_at = NOW() WHERE id = $1", [trip.vehicleId]);
    return report;
  }

  async findAll(query?: any): Promise<any[]> {
    return this.dataSource.query(
      `SELECT t.*, v.vehicle_type AS "vehicleType", v.model AS "vehicleModel",
              v.license_plate AS "licensePlate", d.first_name AS "driverFirstName",
              d.last_name AS "driverLastName"
       FROM trips t
       LEFT JOIN vehicles v ON v.id = t.vehicle_id
       LEFT JOIN users d ON d.id = t.driver_id
       ORDER BY t.departure_time DESC NULLS LAST, t.created_at DESC`,
    );
  }
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
  findByDriver(driverId: number): Promise<any[]> {
    return this.dataSource.query(
      `SELECT t.*, v.vehicle_type AS "vehicleType", v.model AS "vehicleModel",
              v.license_plate AS "licensePlate", v.status AS "vehicleStatus"
       FROM trips t JOIN vehicles v ON v.id = t.vehicle_id
       WHERE t.driver_id = $1 AND v.vehicle_type <> 'train'
       ORDER BY t.departure_time ASC NULLS LAST, t.created_at DESC`,
      [driverId],
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
