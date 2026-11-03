import pino from 'pino';
import { env } from './env';

const isServerlessOrProd =
  env.isProd ||
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

function createLogger(): pino.Logger {
  const baseOptions: pino.LoggerOptions = {
    level: env.isTest ? 'silent' : env.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
        '*.masterPin',
        '*.refreshToken',
        '*.accountNumber',
      ],
      censor: '[redacted]',
    },
  };

  // Only attempt pino-pretty if explicitly requested and NOT running in production/serverless
  if (env.LOG_PRETTY && !isServerlessOrProd) {
    try {
      return pino({
        ...baseOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname,req,res,responseTime',
          },
        },
      });
    } catch {
      // Gracefully fallback to standard JSON logger if transport fails to resolve
      return pino(baseOptions);
    }
  }

  return pino(baseOptions);
}

export const logger = createLogger();
