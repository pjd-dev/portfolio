/**
 * Logging utilities for vault platform
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};
class Logger {
  level;
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level];
  }
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return data
      ? `${prefix} ${message} ${JSON.stringify(data)}`
      : `${prefix} ${message}`;
  }
  debug(message, data) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }
  info(message, data) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }
  warn(message, data) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }
  error(message, error) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message));
      if (error instanceof Error) {
        console.error(error.stack);
      } else if (error) {
        console.error(error);
      }
    }
  }
  setLevel(level) {
    this.level = LOG_LEVELS[level];
  }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map
