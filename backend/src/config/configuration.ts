import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-replace-in-prod',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-replace-in-prod',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localPath: process.env.LOCAL_STORAGE_PATH || './uploads',
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3Region: process.env.AWS_REGION || 'us-east-1',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dgaiqqh7k',
    apiKey: process.env.CLOUDINARY_API_KEY || '415555729322332',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'Cqkj0E-JfT1Gb0s_ab3Gwxy1nZE',
  },
}));
