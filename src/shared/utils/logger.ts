// src/shared/utils/logger.ts

import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from '../../config/env';

const logLevel = config.LOG_LEVEL;

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sdr-agent' },
  transports: [
    // Arquivo de erros (Rotativo)
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d', // Mantém por 7 dias
      level: 'error'
    }),
    // Todos os logs (Rotativo)
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d' // Mantém por 7 dias
    }),
    // Arquivo fixo para leitura rápida do Admin Console (Simulando o antigo combined.log)
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 1, // Apenas 1 arquivo para o console ler sempre o mesmo
      tailable: true
    })
  ]
});

// Console em development
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    })
  );
}

export { logger };
