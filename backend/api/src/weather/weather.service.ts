import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WeatherLog, WeatherLogDocument } from './schemas/weather-log.schema';
import { Model } from 'mongoose';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { ErrorMessages } from 'src/common/messages';
import {
  buildSummary,
  computeAlerts,
  computeBasicStats,
  computeComfortScore,
  computeTemperatureTrend
} from './utils/weather-insights.utils';

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

  async getInsights(from?: Date, to?: Date) {
    const filter: { timestamp?: { $gte?: Date; $lte?: Date } } = {};

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = from;
      if (to) filter.timestamp.$lte = to;
    }

    const logs = await this.weatherModel.find(filter).sort({ timestamp: 1 }).exec();

    if (!logs.length) throw new NotFoundException(ErrorMessages.WEATHER_NOT_FOUND);
    const { count, temps, minTemperature, maxTemperature, avgTemperature, avgWindSpeed } =
      computeBasicStats(logs);

    const trend = computeTemperatureTrend(temps);
    const comfortScore = computeComfortScore(avgTemperature, avgWindSpeed);
    const alerts = computeAlerts(minTemperature, maxTemperature, avgWindSpeed);
    const summary = buildSummary(
      avgTemperature,
      minTemperature,
      maxTemperature,
      avgWindSpeed,
      comfortScore,
      trend
    );

    return {
      timeRange: {
        from: logs[0].timestamp,
        to: logs[logs.length - 1].timestamp
      },
      count,
      minTemperature,
      maxTemperature,
      avgTemperature,
      avgWindSpeed,
      trend,
      comfortScore,
      alerts,
      summary
    };
  }
}
