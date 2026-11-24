import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: any): Promise<unknown> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<unknown> {
    return this.usersService.findOne(+id);
  }

  @Post()
  create(@Body() createUserDto: any): Promise<unknown> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any): Promise<unknown> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
