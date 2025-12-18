/**
 * Logging utilities for vault platform
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: number;

  constructor(level: LogLevel = 'INFO') {
    this.level = LOG_LEVELS[level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return data
      ? `${prefix} ${message} ${JSON.stringify(data)}`
      : `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message));
      if (error instanceof Error) {
        console.error(error.stack);
      } else if (error) {
        console.error(error);
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = LOG_LEVELS[level];
  }
}

export const logger = new Logger();
