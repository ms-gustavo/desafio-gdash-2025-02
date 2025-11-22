export const envConfig = {
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27018/weather_db',
  port: parseInt(process.env.PORT || '3000', 10),
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret'
};
