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
              t.arrival_point AS "arrivalPoint"
       FROM vehicles v LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'in_progress'
       ORDER BY v.vehicle_type, v.model`,
    );
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
