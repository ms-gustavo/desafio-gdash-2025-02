import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WeatherLog, WeatherLogDocument } from './schemas/weather-log.schema';
import { Model } from 'mongoose';
import { CreateWeatherDto } from './dto/create-weather.dto';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(WeatherLog.name)
    private readonly weatherModel: Model<WeatherLogDocument>
  ) {}

  async create(data: CreateWeatherDto) {
    return this.weatherModel.create(data);
  }

  async findAll() {
    return this.weatherModel.find().sort({ timestamp: -1 }).exec();
  }
}
