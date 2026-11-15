import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';

@Injectable()
export class TripsService {
  constructor(@InjectRepository(Trip) private readonly tripsRepository: Repository<Trip>) {}

  async findAll(query?: any): Promise<Trip[]> { return this.tripsRepository.find(); }
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
