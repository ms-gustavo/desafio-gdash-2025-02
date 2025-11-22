import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('api/weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post('logs')
  async createWeatherLog(@Body() body: CreateWeatherDto) {
    return this.weatherService.create(body);
  }

  @Get('logs')
  async getLogs() {
    return this.weatherService.findAll();
  }
}
