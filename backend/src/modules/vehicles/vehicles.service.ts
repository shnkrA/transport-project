import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly vehiclesRepository: Repository<Vehicle>) {}

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
