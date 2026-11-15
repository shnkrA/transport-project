import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceOrder } from '../../entities/maintenance-order.entity';

@Injectable()
export class MaintenanceService {
  constructor(@InjectRepository(MaintenanceOrder) private readonly maintenanceRepository: Repository<MaintenanceOrder>) {}

  async findAll(query?: any): Promise<MaintenanceOrder[]> { return this.maintenanceRepository.find(); }
  async findOne(id: number): Promise<MaintenanceOrder> {
    const item = await this.maintenanceRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Замовлення на ТО з ID ${id} не знайдено`);
    return item;
  }
  async create(data: any): Promise<MaintenanceOrder> { return this.maintenanceRepository.save(data); }
  async update(id: number, data: any): Promise<MaintenanceOrder> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.maintenanceRepository.save(item);
  }
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.maintenanceRepository.remove(item);
  }
}
