import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherLog, WeatherLogSchema } from './schemas/weather-log.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: WeatherLog.name, schema: WeatherLogSchema }])],
  controllers: [WeatherController],
  providers: [WeatherService]
})
export class WeatherModule {}
