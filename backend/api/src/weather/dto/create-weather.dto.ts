import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateWeatherDto {
  @IsDateString()
  timestamp: string;

  @IsNumber()
  temperature: number;

  @IsNumber()
  windSpeed: number;

  @IsBoolean()
  isDay: boolean;

  @IsString()
  location: string;
}
