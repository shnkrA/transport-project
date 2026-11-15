import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../../entities/driver.entity';

@Injectable()
export class DriversService {
  constructor(@InjectRepository(Driver) private readonly driversRepository: Repository<Driver>) {}

  async findAll(query?: any): Promise<Driver[]> { return this.driversRepository.find(); }
  async findOne(id: number): Promise<Driver> {
    const item = await this.driversRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Водій з ID ${id} не знайдено`);
    return item;
  }
  async create(data: any): Promise<Driver> { return this.driversRepository.save(data); }
  async update(id: number, data: any): Promise<Driver> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.driversRepository.save(item);
  }
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.driversRepository.remove(item);
  }
}
