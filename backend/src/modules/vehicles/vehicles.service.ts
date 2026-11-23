import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehiclesRepository: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  getDispatchVehicles(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT v.id, v.vehicle_type AS "vehicleType", v.status, v.model,
              v.license_plate AS "licensePlate", v.capacity_seats AS "capacitySeats",
              t.id AS "activeTripId", t.departure_point AS "departurePoint",
              t.arrival_point AS "arrivalPoint",
              reports.open_reports AS "openReports",
              reports.last_repair AS "lastRepair"
       FROM vehicles v LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'in_progress'
       LEFT JOIN LATERAL (
         SELECT (SELECT json_agg(json_build_object('id', r.id, 'type', r.type, 'message', r.message, 'status', r.status, 'repairPrice', r.repair_price)) FROM driver_reports r WHERE r.vehicle_id = v.id AND r.status <> 'resolved') AS open_reports,
                (SELECT json_build_object('message', r.mechanic_notes, 'price', r.repair_price, 'type', r.type) FROM driver_reports r WHERE r.vehicle_id = v.id AND r.status = 'resolved' AND r.repair_price IS NOT NULL ORDER BY r.resolved_at DESC LIMIT 1) AS last_repair
       ) reports ON TRUE
       ORDER BY v.vehicle_type, v.model`,
    );
  }

  getMechanicBoard(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT v.id, v.vehicle_type AS "vehicleType", v.status, v.model, v.license_plate AS "licensePlate",
              (SELECT json_build_object('message', r.mechanic_notes, 'price', r.repair_price, 'type', r.type) FROM driver_reports r WHERE r.vehicle_id = v.id AND r.status = 'resolved' AND r.repair_price IS NOT NULL ORDER BY r.resolved_at DESC LIMIT 1) AS "lastRepair",
              COALESCE(json_agg(json_build_object('id', r.id, 'type', r.type, 'message', r.message, 'status', r.status, 'repairPrice', r.repair_price, 'createdAt', r.created_at, 'driverName', d.first_name || ' ' || d.last_name)) FILTER (WHERE r.id IS NOT NULL AND r.status <> 'resolved'), '[]'::json) AS reports
       FROM vehicles v LEFT JOIN driver_reports r ON r.vehicle_id = v.id
       LEFT JOIN users d ON d.id = r.driver_id
       WHERE v.status = 'maintenance' OR r.status <> 'resolved'
       GROUP BY v.id ORDER BY v.status = 'maintenance' DESC, v.model`);
  }

  async setMechanicStatus(id: number, status: string): Promise<Vehicle> {
    if (!['available', 'maintenance', 'out_of_service'].includes(status)) throw new BadRequestException('Недійсний стан транспорту');
    const vehicle = await this.findOne(id);
    const [activeTrip] = await this.dataSource.query("SELECT id FROM trips WHERE vehicle_id = $1 AND status IN ('confirmed', 'in_progress') LIMIT 1", [id]);
    if (activeTrip) throw new ConflictException('Транспорт закріплений за активним рейсом');
    vehicle.status = status;
    return this.vehiclesRepository.save(vehicle);
  }

  async resolveReport(id: number, mechanicId: number, message: string, price: number): Promise<any> {
    const [report] = await this.dataSource.query("UPDATE driver_reports SET status = 'resolved', mechanic_notes = $2, repair_price = $3, mechanic_id = $4, resolved_at = NOW() WHERE id = $1 AND status <> 'resolved' RETURNING vehicle_id AS \"vehicleId\"", [id, message.trim(), price, mechanicId]);
    if (!report) throw new NotFoundException('Повідомлення вже закрите або не знайдене');
    const [open] = await this.dataSource.query("SELECT id FROM driver_reports WHERE vehicle_id = $1 AND status <> 'resolved' LIMIT 1", [report.vehicleId]);
    const [activeTrip] = await this.dataSource.query("SELECT id FROM trips WHERE vehicle_id = $1 AND status IN ('confirmed', 'in_progress') LIMIT 1", [report.vehicleId]);
    if (!open && !activeTrip) await this.dataSource.query("UPDATE vehicles SET status = 'available', updated_at = NOW() WHERE id = $1 AND status = 'maintenance'", [report.vehicleId]);
    return { success: true };
  }

  async setDispatchStatus(id: number, status: string): Promise<Vehicle> {
    if (!['available', 'maintenance', 'out_of_service'].includes(status)) {
      throw new BadRequestException('Оберіть доступний, на ТО або не експлуатується');
    }
    const vehicle = await this.findOne(id);
    const [activeTrip] = await this.dataSource.query(
      `SELECT id FROM trips WHERE vehicle_id = $1 AND status IN ('confirmed', 'in_progress') LIMIT 1`, [id],
    );
    if (activeTrip) throw new ConflictException('Не можна змінити стан: за транспортом закріплений активний рейс');
    vehicle.status = status;
    return this.vehiclesRepository.save(vehicle);
  }

  async findAll(query?: any): Promise<Vehicle[]> { return this.vehiclesRepository.find(); }
  async findOne(id: number): Promise<Vehicle> {
    const item = await this.vehiclesRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`ТЗ з ID ${id} не знайдено`);
    return item;
  }
  async create(data: any): Promise<Vehicle> { return this.vehiclesRepository.save(data); }
  async update(id: number, data: any): Promise<Vehicle> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.vehiclesRepository.save(item);
  }
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.vehiclesRepository.remove(item);
  }
}
