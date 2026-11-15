import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelRecord } from '../../entities/fuel-record.entity';

@Injectable()
export class FuelService {
  constructor(@InjectRepository(FuelRecord) private readonly fuelRepository: Repository<FuelRecord>) {}

  async findAll(query?: any): Promise<FuelRecord[]> { return this.fuelRepository.find(); }
  async findOne(id: number): Promise<FuelRecord> {
    const item = await this.fuelRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Запис про паливо з ID ${id} не знайдено`);
    return item;
  }
  async create(data: any): Promise<FuelRecord> { return this.fuelRepository.save(data); }
  async update(id: number, data: any): Promise<FuelRecord> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.fuelRepository.save(item);
  }
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.fuelRepository.remove(item);
  }
}
