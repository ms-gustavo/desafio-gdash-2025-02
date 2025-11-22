import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWeatherDto {
  @ApiProperty({
    description: 'Data e hora da medição',
    example: '2025-11-22T10:30:00Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Temperatura em graus Celsius',
    example: 25.5
  })
  @IsNumber()
  temperature: number;

  @ApiProperty({
    description: 'Velocidade do vento em km/h',
    example: 15.3
  })
  @IsNumber()
  windSpeed: number;

  @ApiProperty({
    description: 'Indica se é dia (true) ou noite (false)',
    example: true
  })
  @IsBoolean()
  isDay: boolean;

  @ApiProperty({
    description: 'Localização da medição',
    example: 'São Paulo, Brasil'
  })
  @IsString()
  location: string;
}
