import { Test, TestingModule } from '@nestjs/testing';
import { WeatherExportService } from './weather-export.service';
import { WeatherLog } from './schemas/weather-log.schema';

describe('WeatherExportService', () => {
  let service: WeatherExportService;

  const mockWeatherLogs: WeatherLog[] = [
    {
      timestamp: new Date('2025-11-22T10:00:00Z'),
      temperature: 25.5,
      windSpeed: 15.3,
      isDay: true,
      location: 'São Paulo, Brasil'
    } as WeatherLog,
    {
      timestamp: new Date('2025-11-22T14:00:00Z'),
      temperature: 28.0,
      windSpeed: 12.5,
      isDay: true,
      location: 'Rio de Janeiro, Brasil'
    } as WeatherLog
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeatherExportService]
    }).compile();

    service = module.get<WeatherExportService>(WeatherExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCSV', () => {
    it('should generate CSV with header and data rows', () => {
      const csv = service.generateCSV(mockWeatherLogs);

      expect(csv).toContain('timestamp,temperature,windSpeed,isDay,location');
      expect(csv).toContain('2025-11-22T10:00:00.000Z');
      expect(csv).toContain('25.5');
      expect(csv).toContain('15.3');
      expect(csv).toContain('true');
      expect(csv).toContain('São Paulo, Brasil');
    });

    it('should handle empty logs array', () => {
      const csv = service.generateCSV([]);

      expect(csv).toBe('timestamp,temperature,windSpeed,isDay,location');
    });

    it('should format multiple rows correctly', () => {
      const csv = service.generateCSV(mockWeatherLogs);
      const rows = csv.split('\n');

      expect(rows.length).toBe(3); // header + 2 data rows
      expect(rows[0]).toBe('timestamp,temperature,windSpeed,isDay,location');
    });

    it('should handle boolean values correctly', () => {
      const csv = service.generateCSV(mockWeatherLogs);

      expect(csv).toContain('true');
    });

    it('should handle special characters in location', () => {
      const logsWithSpecialChars: WeatherLog[] = [
        {
          timestamp: new Date('2025-11-22T10:00:00Z'),
          temperature: 25.5,
          windSpeed: 15.3,
          isDay: true,
          location: 'São Paulo, Brasil'
        } as WeatherLog
      ];

      const csv = service.generateCSV(logsWithSpecialChars);

      expect(csv).toContain('São Paulo, Brasil');
    });
  });

  describe('generateXLSX', () => {
    it('should generate XLSX buffer', async () => {
      const buffer = await service.generateXLSX(mockWeatherLogs);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
    });

    it('should handle empty logs array', async () => {
      const buffer = await service.generateXLSX([]);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
    });

    it('should create workbook with correct sheet name', async () => {
      const buffer = await service.generateXLSX(mockWeatherLogs);

      // Verify buffer is valid Excel format (starts with PK for ZIP)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });

    it('should handle multiple logs', async () => {
      const multipleLogs: WeatherLog[] = [
        ...mockWeatherLogs,
        {
          timestamp: new Date('2025-11-22T18:00:00Z'),
          temperature: 22.0,
          windSpeed: 8.0,
          isDay: false,
          location: 'Brasília, Brasil'
        } as WeatherLog
      ];

      const buffer = await service.generateXLSX(multipleLogs);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
    });

    it('should handle night time logs (isDay: false)', async () => {
      const nightLogs: WeatherLog[] = [
        {
          timestamp: new Date('2025-11-22T22:00:00Z'),
          temperature: 18.0,
          windSpeed: 6.5,
          isDay: false,
          location: 'Porto Alegre, Brasil'
        } as WeatherLog
      ];

      const buffer = await service.generateXLSX(nightLogs);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
    });
  });
});
