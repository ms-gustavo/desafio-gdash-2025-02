import { Injectable } from '@nestjs/common';
import { WeatherLog } from './schemas/weather-log.schema';
import * as ExcelJS from 'exceljs';

@Injectable()
export class WeatherExportService {
  generateCSV(logs: WeatherLog[]): string {
    const header = ['timestamp', 'temperature', 'windSpeed', 'isDay', 'location'];

    const rows = logs.map((l) =>
      [l.timestamp.toISOString(), l.temperature, l.windSpeed, l.isDay, l.location].join(',')
    );

    return [header.join(','), ...rows].join('\n');
  }

  async generateXLSX(logs: WeatherLog[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Weather Logs');

    sheet.addRow(['Horário', 'Temperatura', 'Velocidade do Vento', 'É Dia?', 'Localização']);

    logs.forEach((log) => {
      sheet.addRow([
        log.timestamp,
        log.temperature,
        log.windSpeed,
        log.isDay ? 'Sim' : 'Não',
        log.location
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
