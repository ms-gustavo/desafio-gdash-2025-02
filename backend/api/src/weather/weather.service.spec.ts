import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { getModelToken } from '@nestjs/mongoose';
import { WeatherLog } from './schemas/weather-log.schema';
import { CreateWeatherDto } from './dto/create-weather.dto';

describe('WeatherService', () => {
  let service: WeatherService;

  const mockWeatherData: CreateWeatherDto = {
    temperature: 28.5,
    humidity: 70,
    windSpeed: 12,
    condition: 'cloudy',
    rainProbability: 0.3,
    timestamp: '2025-01-01T15:00:00Z',
    location: 'Salvador, BA'
  };

  const mockWeatherModel = {
    create: jest.fn(),
    find: jest.fn(),
    sort: jest.fn(),
    exec: jest.fn()
  };

  // Setup chaining after object creation
  mockWeatherModel.find.mockReturnValue(mockWeatherModel);
  mockWeatherModel.sort.mockReturnValue(mockWeatherModel);

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

    jest.clearAllMocks();
  });

  it('deve criar um WeatherLog com sucesso', async () => {
    mockWeatherModel.create.mockResolvedValue(mockWeatherData);

    const result = await service.create(mockWeatherData);

    expect(mockWeatherModel.create).toHaveBeenCalledTimes(1);
    expect(mockWeatherModel.create).toHaveBeenCalledWith(mockWeatherData);
    expect(result).toEqual(mockWeatherData);
  });

  it('deve retornar todos os registros ordenados por timestamp DESC', async () => {
    const mockList = [
      { ...mockWeatherData, timestamp: '2025-01-02T10:00:00Z' },
      { ...mockWeatherData, timestamp: '2025-01-01T10:00:00Z' }
    ];

    mockWeatherModel.exec.mockResolvedValue(mockList);

    const result = await service.findAll();

    expect(mockWeatherModel.find).toHaveBeenCalled();
    expect(mockWeatherModel.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(mockWeatherModel.exec).toHaveBeenCalled();
    expect(result).toEqual(mockList);
  });

  it('deve lançar erro caso create falhe', async () => {
    mockWeatherModel.create.mockRejectedValue(new Error('Create failed'));

    await expect(service.create(mockWeatherData)).rejects.toThrow('Create failed');
  });
});
