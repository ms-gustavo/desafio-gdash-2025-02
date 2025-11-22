import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherExportService } from './weather-export.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { GetWeatherLogsQueryDto } from './dto/get-weather-logs-query.dto';
import { Response } from 'express';

describe('WeatherController', () => {
  let controller: WeatherController;
  let weatherService: WeatherService;
  let exportService: WeatherExportService;

  const mockWeatherService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findPaginated: jest.fn(),
    getInsights: jest.fn()
  };

  const mockExportService = {
    generateCSV: jest.fn(),
    generateXLSX: jest.fn()
  };

  const mockWeatherLog = {
    _id: '507f1f77bcf86cd799439011',
    timestamp: new Date('2025-11-22T10:00:00Z'),
    temperature: 25.5,
    windSpeed: 15.3,
    isDay: true,
    location: 'São Paulo, Brasil',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: mockWeatherService
        },
        {
          provide: WeatherExportService,
          useValue: mockExportService
        }
      ]
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    weatherService = module.get<WeatherService>(WeatherService);
    exportService = module.get<WeatherExportService>(WeatherExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createWeatherLog', () => {
    it('should create a weather log', async () => {
      const createWeatherDto: CreateWeatherDto = {
        timestamp: '2025-11-22T10:00:00Z',
        temperature: 25.5,
        windSpeed: 15.3,
        isDay: true,
        location: 'São Paulo, Brasil'
      };

      mockWeatherService.create.mockResolvedValue(mockWeatherLog);

      const result = await controller.createWeatherLog(createWeatherDto);

      expect(result).toEqual(mockWeatherLog);
      expect(weatherService.create).toHaveBeenCalledWith(createWeatherDto);
    });

    it('should handle night time weather log', async () => {
      const createWeatherDto: CreateWeatherDto = {
        timestamp: '2025-11-22T22:00:00Z',
        temperature: 18.0,
        windSpeed: 8.5,
        isDay: false,
        location: 'Rio de Janeiro, Brasil'
      };

      const nightLog = { ...mockWeatherLog, ...createWeatherDto, isDay: false };
      mockWeatherService.create.mockResolvedValue(nightLog);

      const result = await controller.createWeatherLog(createWeatherDto);

      expect(result.isDay).toBe(false);
      expect(weatherService.create).toHaveBeenCalledWith(createWeatherDto);
    });
  });

  describe('getLogs', () => {
    it('should return paginated weather logs', async () => {
      const query: GetWeatherLogsQueryDto = {
        page: 1,
        limit: 20
      };

      const mockResponse = {
        data: [mockWeatherLog],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          pageCount: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockWeatherService.findPaginated.mockResolvedValue(mockResponse);

      const result = await controller.getLogs(query);

      expect(result).toEqual(mockResponse);
      expect(weatherService.findPaginated).toHaveBeenCalledWith(query);
    });

    it('should filter logs by date range', async () => {
      const query: GetWeatherLogsQueryDto = {
        from: '2025-11-01T00:00:00Z',
        to: '2025-11-22T23:59:59Z',
        page: 1,
        limit: 20
      };

      const mockResponse = {
        data: [mockWeatherLog],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          pageCount: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockWeatherService.findPaginated.mockResolvedValue(mockResponse);

      const result = await controller.getLogs(query);

      expect(result).toEqual(mockResponse);
      expect(weatherService.findPaginated).toHaveBeenCalledWith(query);
    });

    it('should handle pagination parameters', async () => {
      const query: GetWeatherLogsQueryDto = {
        page: 2,
        limit: 10
      };

      const mockResponse = {
        data: [mockWeatherLog],
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          pageCount: 3,
          hasNext: true,
          hasPrev: true
        }
      };

      mockWeatherService.findPaginated.mockResolvedValue(mockResponse);

      const result = await controller.getLogs(query);

      expect(result.meta.page).toBe(2);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  describe('getInsights', () => {
    it('should return weather insights without date filter', async () => {
      const mockInsights = {
        timeRange: {
          from: new Date('2025-11-01T00:00:00Z'),
          to: new Date('2025-11-22T23:59:59Z')
        },
        count: 150,
        minTemperature: 18.2,
        maxTemperature: 32.5,
        avgTemperature: 24.3,
        avgWindSpeed: 12.5,
        trend: 'stable',
        comfortScore: 75,
        alerts: [],
        summary: 'Condições estáveis'
      };

      mockWeatherService.getInsights.mockResolvedValue(mockInsights);

      const result = await controller.getInsights();

      expect(result.avgTemperature).toBe(24.3);
      expect(result.timeRange.from).toBeDefined();
      expect(weatherService.getInsights).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should return insights with date range filter', async () => {
      const from = '2025-11-01T00:00:00Z';
      const to = '2025-11-22T23:59:59Z';

      const mockInsights = {
        timeRange: {
          from: new Date(from),
          to: new Date(to)
        },
        count: 50,
        minTemperature: 20.0,
        maxTemperature: 30.0,
        avgTemperature: 25.0,
        avgWindSpeed: 10.0,
        trend: 'rising',
        comfortScore: 80,
        alerts: [],
        summary: 'Tendência de aquecimento'
      };

      mockWeatherService.getInsights.mockResolvedValue(mockInsights);

      const result = await controller.getInsights(from, to);

      expect(result.trend).toBe('rising');
      expect(weatherService.getInsights).toHaveBeenCalledWith(new Date(from), new Date(to));
    });
  });

  describe('exportCSV', () => {
    it('should export weather logs as CSV', async () => {
      const mockLogs = [mockWeatherLog];
      const mockCSV =
        'timestamp,temperature,windSpeed,isDay,location\n2025-11-22T10:00:00Z,25.5,15.3,true,São Paulo';

      mockWeatherService.findAll.mockResolvedValue(mockLogs);
      mockExportService.generateCSV.mockReturnValue(mockCSV);

      const mockResponse = {
        send: jest.fn()
      } as unknown as Response;

      await controller.exportCSV(mockResponse);

      expect(weatherService.findAll).toHaveBeenCalled();
      expect(exportService.generateCSV).toHaveBeenCalledWith(mockLogs);
      expect(mockResponse.send).toHaveBeenCalledWith(mockCSV);
    });
  });

  describe('exportXLSX', () => {
    it('should export weather logs as Excel', async () => {
      const mockLogs = [mockWeatherLog];
      const mockBuffer = Buffer.from('excel data');

      mockWeatherService.findAll.mockResolvedValue(mockLogs);
      mockExportService.generateXLSX.mockResolvedValue(mockBuffer);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn()
      } as unknown as Response;

      await controller.exportXLSX(mockResponse);

      expect(weatherService.findAll).toHaveBeenCalled();
      expect(exportService.generateXLSX).toHaveBeenCalledWith(mockLogs);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="weather_logs.xlsx"'
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });
  });
});
