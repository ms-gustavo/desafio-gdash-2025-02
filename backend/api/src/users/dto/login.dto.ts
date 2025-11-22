import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123'
  })
  @IsNotEmpty()
  password: string;
}
