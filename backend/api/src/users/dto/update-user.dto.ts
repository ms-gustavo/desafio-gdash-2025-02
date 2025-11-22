import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Nova senha do usuário (mínimo 6 caracteres)',
    example: 'novaSenha123',
    minLength: 6
  })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'Novo papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
