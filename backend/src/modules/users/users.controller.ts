import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Користувачі')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список користувачів' })
  findAll(@Query() query: any): Promise<unknown> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати користувача за ID' })
  findOne(@Param('id') id: string): Promise<unknown> {
    return this.usersService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Створити користувача' })
  create(@Body() createUserDto: any): Promise<unknown> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити користувача' })
  update(@Param('id') id: string, @Body() updateUserDto: any): Promise<unknown> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити користувача' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
