import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(@InjectRepository(Order) private readonly ordersRepository: Repository<Order>) {}

  async findAll(query?: any): Promise<Order[]> { return this.ordersRepository.find(); }
  async findOne(id: number): Promise<Order> {
    const item = await this.ordersRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    return item;
  }
  async create(data: any): Promise<Order> { return this.ordersRepository.save(data); }
  async update(id: number, data: any): Promise<Order> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.ordersRepository.save(item);
  }
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.ordersRepository.remove(item);
  }
}
