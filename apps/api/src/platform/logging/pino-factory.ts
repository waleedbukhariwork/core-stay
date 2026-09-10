import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino, { type Logger } from 'pino';
import type { Options } from 'pino-http';
import { AppConfig } from '../config/app-config.js';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["x-access-token"]',
  'req.headers["x-refresh-token"]',
];

export function createRootLogger(config: AppConfig): Logger {
  return pino({
    level: config.logLevel,
    redact: {
      paths: REDACT_PATHS,
      remove: true,
    },
    ...(config.isLocal && config.logLevel !== 'silent'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
  });
}

export function requestLogOptions(logger: Logger): Options {
  return {
    logger,
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const header = req.headers['x-request-id'];
      const id =
        typeof header === 'string' && header.length > 0 ? header : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customProps: (req) => ({ requestId: req.id }),
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: typeof req.url === 'string' ? req.url.split('?')[0] : undefined,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  };
}
