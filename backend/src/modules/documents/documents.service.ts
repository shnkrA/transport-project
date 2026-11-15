import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentsService {
  async findAll(query?: any) { /* TODO: реалізувати */ }
  async findOne(id: number) { /* TODO: реалізувати */ }
  async create(data: any) { /* TODO: реалізувати */ }
  async update(id: number, data: any) { /* TODO: реалізувати */ }
  async remove(id: number) { /* TODO: реалізувати */ }
}
