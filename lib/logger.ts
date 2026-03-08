/**
 * Structured logging utility — production-ready logging with levels,
 * correlation IDs, and JSON output for log aggregation services.
 *
 * Drop-in replacement for console.log/warn/error.
 * In production, output is JSON for Datadog/Sentry/CloudWatch ingestion.
 * In development, output is human-readable.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  route?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  meta?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const envLogLevel = process.env.LOG_LEVEL as string | undefined;
const MIN_LEVEL: LogLevel = (envLogLevel && envLogLevel in LOG_LEVELS)
  ? envLogLevel as LogLevel
  : (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatError(err: unknown): LogEntry['error'] | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    };
  }
  return { name: 'UnknownError', message: String(err) };
}

function emit(entry: LogEntry) {
  const output = process.env.NODE_ENV === 'production'
    ? JSON.stringify(entry)
    : `[${entry.level.toUpperCase()}] ${entry.message}${entry.error ? ` — ${entry.error.message}` : ''}${entry.meta ? ` ${JSON.stringify(entry.meta)}` : ''}`;

  switch (entry.level) {
    case 'debug':
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

/**
 * Create a scoped logger with optional correlation ID and route context.
 */
export function createLogger(scope?: { correlationId?: string; route?: string; userId?: string }) {
  function log(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: unknown) {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...scope,
      meta,
      error: formatError(error),
    };

    emit(entry);
  }

  return {
    debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>, error?: unknown) => log('warn', message, meta, error),
    error: (message: string, meta?: Record<string, unknown>, error?: unknown) => log('error', message, meta, error),

    /** Time an async operation and log its duration. */
    async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      try {
        const result = await fn();
        log('info', `${label} completed`, { duration: Math.round(performance.now() - start) });
        return result;
      } catch (err) {
        log('error', `${label} failed`, { duration: Math.round(performance.now() - start) }, err);
        throw err;
      }
    },
  };
}

/** Default logger for quick use */
export const logger = createLogger();
