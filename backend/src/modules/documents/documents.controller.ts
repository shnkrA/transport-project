import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Документи')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список документів' })
  findAll(@Query() query: any) { return this.documentsService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати документ за ID' })
  findOne(@Param('id') id: string) { return this.documentsService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Створити документ' })
  create(@Body() data: any) { return this.documentsService.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити документ' })
  update(@Param('id') id: string, @Body() data: any) { return this.documentsService.update(+id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити документ' })
  remove(@Param('id') id: string) { return this.documentsService.remove(+id); }
}
