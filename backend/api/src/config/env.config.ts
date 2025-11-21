export const envConfig = {
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/default',
  port: parseInt(process.env.PORT || '3000', 10)
};
