import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { CreateWeatherDto } from './dto/create-weather.dto';

describe('WeatherController', () => {
  let controller: WeatherController;

  const mockWeatherService = {
    create: jest.fn(),
    findAll: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: mockWeatherService
        }
      ]
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    controller = module.get<WeatherController>(WeatherController);
  });

  describe('createWeatherLog', () => {
    it('should create a weather log', async () => {
      const createWeatherDto: CreateWeatherDto = {
        timestamp: '2025-11-22T01:15:00Z',
        temperature: 25,
        windSpeed: 10.6,
        isDay: false,
        location: 'Salvador, BA'
      };
      const result = { id: 1, ...createWeatherDto };

      mockWeatherService.create.mockResolvedValue(result);

      expect(await controller.createWeatherLog(createWeatherDto)).toBe(result);
      expect(mockWeatherService.create).toHaveBeenCalledWith(createWeatherDto);
    });
  });

  describe('getLogs', () => {
    it('should return an array of weather logs', async () => {
      const result = [
        { id: 1, temperature: 25, humidity: 60, pressure: 1013 },
        { id: 2, temperature: 22, humidity: 65, pressure: 1015 }
      ];

      mockWeatherService.findAll.mockResolvedValue(result);

      expect(await controller.getLogs()).toBe(result);
      expect(mockWeatherService.findAll).toHaveBeenCalled();
    });
  });
});
