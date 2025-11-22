import { IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateWeatherDto {
  @IsNumber()
  temperature: number;

  @IsNumber()
  humidity: number;

  @IsNumber()
  windSpeed: number;

  @IsString()
  condition: string;

  @IsNumber()
  rainProbability: number;

  @IsDateString()
  timestamp: string;

  @IsString()
  location: string;
}
