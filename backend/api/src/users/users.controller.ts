import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Usuários')
@Controller('api/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'usuario@example.com' },
        name: { type: 'string', example: 'João Silva' },
        role: { type: 'string', example: 'USER' },
        createdAt: { type: 'string', example: '2025-11-22T10:30:00Z' },
        updatedAt: { type: 'string', example: '2025-11-22T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          email: { type: 'string', example: 'usuario@example.com' },
          name: { type: 'string', example: 'João Silva' },
          role: { type: 'string', example: 'USER' },
          createdAt: { type: 'string', example: '2025-11-22T10:30:00Z' },
          updatedAt: { type: 'string', example: '2025-11-22T10:30:00Z' }
        }
      }
    }
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'usuario@example.com' },
        name: { type: 'string', example: 'João Silva' },
        role: { type: 'string', example: 'USER' },
        createdAt: { type: 'string', example: '2025-11-22T10:30:00Z' },
        updatedAt: { type: 'string', example: '2025-11-22T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'usuario@example.com' },
        name: { type: 'string', example: 'João Silva' },
        role: { type: 'string', example: 'USER' },
        createdAt: { type: 'string', example: '2025-11-22T10:30:00Z' },
        updatedAt: { type: 'string', example: '2025-11-22T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário' })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
