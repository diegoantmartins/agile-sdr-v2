import app from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import prisma from './shared/db';

const start = async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`🚀 Server ready at http://localhost:${env.PORT}`);
    
    // Optional: Start periodic scheduler here if not using external cron
    // setInterval(() => reactivationJob.execute(), 3600000); 

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
