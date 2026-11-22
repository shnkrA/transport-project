import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll(query?: any): Promise<User[]> {
    const where: any = {};
    if (query?.roleId) where.roleId = +query.roleId;
    if (query?.isActive !== undefined) where.isActive = query.isActive === 'true';
    return this.usersRepository.find({ where });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Користувач з ID ${id} не знайдено`);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email: email.toLowerCase().trim() } });
    return user ?? undefined;
  }

  findRoleByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async getRoleName(roleId: number): Promise<string | undefined> {
    return (await this.rolesRepository.findOne({ where: { id: roleId } }))?.name;
  }

  async create(data: any): Promise<User> {
    const user = new User();
    user.firstName = data.firstName;
    user.lastName = data.lastName;
    user.middleName = data.middleName;
    user.email = data.email.toLowerCase().trim();
    user.phone = data.phone;
    user.roleId = data.roleId;
    user.passwordHash = await bcrypt.hash(data.password, 10);
    return this.usersRepository.save(user);
  }

  async update(id: number, data: any): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, data);
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
