import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherLog, WeatherLogSchema } from './schemas/weather-log.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherExportService } from './weather-export.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: WeatherLog.name, schema: WeatherLogSchema }])],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherExportService]
})
export class WeatherModule {}
