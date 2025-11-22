import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'senha123',
    minLength: 6
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva'
  })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
