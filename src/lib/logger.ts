/**
 * Structured logger for production observability.
 * Outputs JSON in production, pretty-prints in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'] ?? LOG_LEVELS.info;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function write(entry: LogEntry): void {
  if (LOG_LEVELS[entry.level] < MIN_LEVEL) return;

  if (IS_PRODUCTION) {
    // Structured JSON for log aggregation (Vercel, Datadog, etc.)
    const output = JSON.stringify(entry);
    if (entry.level === 'error') {
      console.error(output);
    } else if (entry.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  } else {
    // Pretty format for development
    const { level, message, timestamp, ...extra } = entry;
    const prefix = `[${level.toUpperCase()}] ${timestamp}`;
    const extraStr = Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : '';
    if (level === 'error') {
      console.error(`${prefix} ${message}${extraStr}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}${extraStr}`);
    } else {
      console.log(`${prefix} ${message}${extraStr}`);
    }
  }
}

function createLogFn(level: LogLevel) {
  return (message: string, meta?: Record<string, unknown>) => {
    write({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  };
}

export const logger = {
  debug: createLogFn('debug'),
  info: createLogFn('info'),
  warn: createLogFn('warn'),
  error: createLogFn('error'),
};
