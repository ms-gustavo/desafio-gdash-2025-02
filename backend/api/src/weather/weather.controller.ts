import { Body, Controller, Get, Header, Post, Query, Res, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherExportService } from './weather-export.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import { GetWeatherLogsQueryDto } from './dto/get-weather-logs-query.dto';

@Controller('api/weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly exportService: WeatherExportService
  ) {}

  @Post('logs')
  async createWeatherLog(@Body() body: CreateWeatherDto) {
    return this.weatherService.create(body);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getLogs(@Query() query: GetWeatherLogsQueryDto) {
    return this.weatherService.findPaginated(query);
  }

  @Get('insights')
  async getInsights(@Query('from') from?: string, @Query('to') to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const insights = await this.weatherService.getInsights(fromDate, toDate);

    return {
      ...insights,
      timeRange: {
        from: insights.timeRange.from.toISOString(),
        to: insights.timeRange.to.toISOString()
      }
    };
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="weather_logs.csv"')
  async exportCSV(@Res() res: Response) {
    const logs = await this.weatherService.findAll();
    const csv = this.exportService.generateCSV(logs);
    return res.send(csv);
  }

  @Get('export.xlsx')
  async exportXLSX(@Res() res: Response) {
    const logs = await this.weatherService.findAll();
    const buffer = await this.exportService.generateXLSX(logs);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="weather_logs.xlsx"');

    return res.send(buffer);
  }
}
