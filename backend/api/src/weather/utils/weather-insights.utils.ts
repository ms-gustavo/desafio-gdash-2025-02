import { WeatherLog } from '../schemas/weather-log.schema';
import { InfoMessages } from 'src/common/messages';

function formatMultiple(template: string, ...values: (string | number)[]) {
  let out = template;
  for (const v of values) {
    out = out.replace('{}', String(v));
  }
  return out;
}

const TEMP_TREND_THRESHOLD = 0.5;
const TEMP_COLD_THRESHOLD = 18;
const TEMP_HOT_THRESHOLD = 28;
const TEMP_ALERT_HOT = 30;
const TEMP_ALERT_COLD = 20;
const WIND_ALERT_THRESHOLD = 25;
const WIND_PENALTY_THRESHOLD = 20;
const COMFORT_MAX_SCORE = 100;

export function computeBasicStats(logs: WeatherLog[]) {
  const count = logs.length;

  const temps = logs.map((l) => l.temperature);
  const winds = logs.map((l) => l.windSpeed);

  const minTemperature = Math.min(...temps);
  const maxTemperature = Math.max(...temps);

  const avgTemperature = temps.reduce((a, b) => a + b, 0) / count;
  const avgWindSpeed = winds.reduce((a, b) => a + b, 0) / count;

  return {
    count,
    temps,
    winds,
    minTemperature,
    maxTemperature,
    avgTemperature,
    avgWindSpeed
  };
}

export function computeTemperatureTrend(temperatures: number[]) {
  const count = temperatures.length;

  const third = Math.max(1, Math.floor(count / 3));
  const firstChunk = temperatures.slice(0, third);
  const lastChunk = temperatures.slice(-third);

  const avgFirst = firstChunk.reduce((a, b) => a + b, 0) / firstChunk.length;
  const avgLast = lastChunk.reduce((a, b) => a + b, 0) / lastChunk.length;

  const delta = avgLast - avgFirst;

  if (delta > TEMP_TREND_THRESHOLD) return 'rising';
  if (delta < -TEMP_TREND_THRESHOLD) return 'falling';
  return 'stable';
}

export function computeComfortScore(avgTemperature: number, avgWindSpeed: number) {
  let score = COMFORT_MAX_SCORE;

  if (avgTemperature < TEMP_COLD_THRESHOLD) {
    score -= (TEMP_COLD_THRESHOLD - avgTemperature) * 2;
  }

  if (avgTemperature > TEMP_HOT_THRESHOLD) {
    score -= (avgTemperature - TEMP_HOT_THRESHOLD) * 2;
  }

  if (avgWindSpeed > WIND_PENALTY_THRESHOLD) {
    score -= avgWindSpeed - WIND_PENALTY_THRESHOLD;
  }

  return Math.max(0, Math.min(COMFORT_MAX_SCORE, Math.round(score)));
}

export function computeAlerts(
  minTemperature: number,
  maxTemperature: number,
  avgWindSpeed: number
): string[] {
  const alerts: string[] = [];

  if (maxTemperature >= TEMP_ALERT_HOT) {
    alerts.push(InfoMessages.WEATHER_ALERT_HOT);
  } else if (minTemperature <= TEMP_ALERT_COLD) {
    alerts.push(InfoMessages.WEATHER_ALERT_COLD);
  }

  if (avgWindSpeed >= WIND_ALERT_THRESHOLD) {
    alerts.push(InfoMessages.WEATHER_ALERT_WIND);
  }

  if (!alerts.length) {
    alerts.push(InfoMessages.WEATHER_ALERT_NONE);
  }

  return alerts;
}

export function buildSummary(
  avgTemperature: number,
  minTemperature: number,
  maxTemperature: number,
  avgWindSpeed: number,
  comfortScore: number,
  trend: 'rising' | 'falling' | 'stable'
) {
  const parts: string[] = [];

  parts.push(
    formatMultiple(
      InfoMessages.WEATHER_SUMMARY_TEMPERATURE_RANGE,
      avgTemperature.toFixed(1),
      minTemperature.toFixed(1),
      maxTemperature.toFixed(1)
    )
  );

  if (trend === 'rising') parts.push(InfoMessages.WEATHER_SUMMARY_TREND_RISING);
  else if (trend === 'falling') parts.push(InfoMessages.WEATHER_SUMMARY_TREND_FALLING);
  else parts.push(InfoMessages.WEATHER_SUMMARY_TREND_STABLE);

  parts.push(formatMultiple(InfoMessages.WEATHER_SUMMARY_WIND_SPEED, avgWindSpeed.toFixed(1)));

  parts.push(formatMultiple(InfoMessages.WEATHER_SUMMARY_COMFORT_SCORE, comfortScore));

  return parts.join(' ');
}
