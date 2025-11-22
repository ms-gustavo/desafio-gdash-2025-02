import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetWeatherLogsQueryDto {
  @ApiPropertyOptional({
    description: 'Data inicial para filtrar os logs',
    example: '2025-11-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Data final para filtrar os logs',
    example: '2025-11-22T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    example: 1,
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
