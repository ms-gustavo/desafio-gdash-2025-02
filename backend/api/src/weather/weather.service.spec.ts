import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { getModelToken } from '@nestjs/mongoose';
import { WeatherLog } from './schemas/weather-log.schema';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { GetWeatherLogsQueryDto } from './dto/get-weather-logs-query.dto';
import { NotFoundException } from '@nestjs/common';

describe('WeatherService', () => {
  let service: WeatherService;
  let weatherModel: any;

  const mockWeatherLog = {
    _id: '507f1f77bcf86cd799439011',
    timestamp: new Date('2025-11-22T10:00:00Z'),
    temperature: 25.5,
    windSpeed: 15.3,
    isDay: true,
    location: 'São Paulo, Brasil'
  };

  const mockWeatherModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: getModelToken(WeatherLog.name),
          useValue: mockWeatherModel
        }
      ]
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    weatherModel = module.get(getModelToken(WeatherLog.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a weather log', async () => {
      const createWeatherDto: CreateWeatherDto = {
        timestamp: '2025-11-22T10:00:00Z',
        temperature: 25.5,
        windSpeed: 15.3,
        isDay: true,
        location: 'São Paulo, Brasil'
      };

      mockWeatherModel.create.mockResolvedValue(mockWeatherLog);

      const result = await service.create(createWeatherDto);

      expect(result).toEqual(mockWeatherLog);
      expect(weatherModel.create).toHaveBeenCalledWith(createWeatherDto);
    });

    it('should handle night time weather log', async () => {
      const createWeatherDto: CreateWeatherDto = {
        timestamp: '2025-11-22T22:00:00Z',
        temperature: 18.0,
        windSpeed: 8.5,
        isDay: false,
        location: 'Rio de Janeiro, Brasil'
      };

      const nightLog = { ...mockWeatherLog, ...createWeatherDto };
      mockWeatherModel.create.mockResolvedValue(nightLog);

      const result = await service.create(createWeatherDto);

      expect(result.isDay).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all weather logs sorted by timestamp descending', async () => {
      const mockLogs = [mockWeatherLog, { ...mockWeatherLog, _id: '507f1f77bcf86cd799439012' }];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.findAll();

      expect(result).toEqual(mockLogs);
      expect(weatherModel.find).toHaveBeenCalled();
    });
  });

  describe('findPaginated', () => {
    it('should return paginated weather logs', async () => {
      const query: GetWeatherLogsQueryDto = {
        page: 1,
        limit: 20
      };

      const mockLogs = [mockWeatherLog];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockLogs)
            })
          })
        })
      });

      mockWeatherModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1)
      });

      const result = await service.findPaginated(query);

      expect(result.data).toEqual(mockLogs);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter logs by date range', async () => {
      const query: GetWeatherLogsQueryDto = {
        from: '2025-11-01T00:00:00Z',
        to: '2025-11-22T23:59:59Z',
        page: 1,
        limit: 20
      };

      const mockLogs = [mockWeatherLog];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockLogs)
            })
          })
        })
      });

      mockWeatherModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1)
      });

      const result = await service.findPaginated(query);

      expect(result.data).toEqual(mockLogs);
      expect(weatherModel.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date(query.from!),
          $lte: new Date(query.to!)
        }
      });
    });

    it('should calculate pagination metadata correctly', async () => {
      const query: GetWeatherLogsQueryDto = {
        page: 2,
        limit: 10
      };

      const mockLogs = [mockWeatherLog];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockLogs)
            })
          })
        })
      });

      mockWeatherModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(25)
      });

      const result = await service.findPaginated(query);

      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(2);
      expect(result.meta.pageCount).toBe(3);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  describe('getInsights', () => {
    it('should return weather insights', async () => {
      const mockLogs = [
        { ...mockWeatherLog, temperature: 20, windSpeed: 10 },
        { ...mockWeatherLog, temperature: 30, windSpeed: 20 },
        { ...mockWeatherLog, temperature: 25, windSpeed: 15 }
      ];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.getInsights();

      expect(result.count).toBe(3);
      expect(result.minTemperature).toBe(20);
      expect(result.maxTemperature).toBe(30);
      expect(result.avgTemperature).toBe(25);
      expect(result.avgWindSpeed).toBe(15);
    });

    it('should filter insights by date range', async () => {
      const from = new Date('2025-11-01T00:00:00Z');
      const to = new Date('2025-11-22T23:59:59Z');

      const mockLogs = [
        { ...mockWeatherLog, temperature: 22, windSpeed: 12 },
        { ...mockWeatherLog, temperature: 28, windSpeed: 18 }
      ];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.getInsights(from, to);

      expect(result.count).toBe(2);
      expect(weatherModel.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: from,
          $lte: to
        }
      });
    });

    it('should throw NotFoundException when no logs found', async () => {
      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([])
        })
      });

      await expect(service.getInsights()).rejects.toThrow(NotFoundException);
      await expect(service.getInsights()).rejects.toThrow('Dados meteorológicos não encontrados');
    });

    it('should include trend analysis', async () => {
      const mockLogs = [
        { ...mockWeatherLog, temperature: 20 },
        { ...mockWeatherLog, temperature: 22 },
        { ...mockWeatherLog, temperature: 24 },
        { ...mockWeatherLog, temperature: 26 }
      ];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.getInsights();

      expect(result.trend).toBeDefined();
      expect(['rising', 'falling', 'stable']).toContain(result.trend);
    });

    it('should include comfort score', async () => {
      const mockLogs = [{ ...mockWeatherLog, temperature: 24, windSpeed: 10 }];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.getInsights();

      expect(result.comfortScore).toBeDefined();
      expect(result.comfortScore).toBeGreaterThanOrEqual(0);
      expect(result.comfortScore).toBeLessThanOrEqual(100);
    });

    it('should include alerts array', async () => {
      const mockLogs = [{ ...mockWeatherLog, temperature: 40, windSpeed: 50 }];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.getInsights();

      expect(result.alerts).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should include summary text', async () => {
      const mockLogs = [{ ...mockWeatherLog, temperature: 25, windSpeed: 10 }];

      mockWeatherModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await service.getInsights();

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
    });
  });
});
