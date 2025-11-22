import { Body, Controller, Get, Header, Post, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiProduces
} from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { WeatherExportService } from './weather-export.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import { GetWeatherLogsQueryDto } from './dto/get-weather-logs-query.dto';

@ApiTags('Dados Meteorológicos')
@Controller('api/weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly exportService: WeatherExportService
  ) {}

  @Post('logs')
  @ApiOperation({ summary: 'Criar novo registro meteorológico' })
  @ApiResponse({
    status: 201,
    description: 'Registro meteorológico criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        timestamp: { type: 'string', example: '2025-11-22T10:30:00Z' },
        temperature: { type: 'number', example: 25.5 },
        windSpeed: { type: 'number', example: 15.3 },
        isDay: { type: 'boolean', example: true },
        location: { type: 'string', example: 'São Paulo, Brasil' },
        createdAt: { type: 'string', example: '2025-11-22T10:30:00Z' },
        updatedAt: { type: 'string', example: '2025-11-22T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createWeatherLog(@Body() body: CreateWeatherDto) {
    return this.weatherService.create(body);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar registros meteorológicos com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros meteorológicos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              timestamp: { type: 'string', example: '2025-11-22T10:30:00Z' },
              temperature: { type: 'number', example: 25.5 },
              windSpeed: { type: 'number', example: 15.3 },
              isDay: { type: 'boolean', example: true },
              location: { type: 'string', example: 'São Paulo, Brasil' }
            }
          }
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 5 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getLogs(@Query() query: GetWeatherLogsQueryDto) {
    return this.weatherService.findPaginated(query);
  }

  @Get('insights')
  @ApiOperation({
    summary: 'Obter insights e estatísticas dos dados meteorológicos'
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Data inicial para filtrar os insights',
    example: '2025-11-01T00:00:00Z'
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Data final para filtrar os insights',
    example: '2025-11-22T23:59:59Z'
  })
  @ApiResponse({
    status: 200,
    description: 'Insights retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        avgTemperature: { type: 'number', example: 24.3 },
        maxTemperature: { type: 'number', example: 32.5 },
        minTemperature: { type: 'number', example: 18.2 },
        avgWindSpeed: { type: 'number', example: 12.5 },
        maxWindSpeed: { type: 'number', example: 25.0 },
        minWindSpeed: { type: 'number', example: 5.0 },
        totalRecords: { type: 'number', example: 150 },
        timeRange: {
          type: 'object',
          properties: {
            from: { type: 'string', example: '2025-11-01T00:00:00Z' },
            to: { type: 'string', example: '2025-11-22T23:59:59Z' }
          }
        }
      }
    }
  })
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
  @ApiOperation({ summary: 'Exportar registros meteorológicos em formato CSV' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'Arquivo CSV gerado com sucesso',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          example:
            'ID,Timestamp,Temperature,Wind Speed,Is Day,Location\n507f...,2025-11-22T10:30:00Z,25.5,15.3,true,São Paulo'
        }
      }
    }
  })
  async exportCSV(@Res() res: Response) {
    const logs = await this.weatherService.findAll();
    const csv = this.exportService.generateCSV(logs);
    return res.send(csv);
  }

  @Get('export.xlsx')
  @ApiOperation({
    summary: 'Exportar registros meteorológicos em formato Excel'
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: 200,
    description: 'Arquivo Excel gerado com sucesso',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
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
