import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'infra360-super-secret-jwt-key-for-hackathon-2026',
  jwtExpiresIn: '7d',
  mongoUri: process.env.MONGODB_URI || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  simulatedScanIntervalMs: 60000,
};
