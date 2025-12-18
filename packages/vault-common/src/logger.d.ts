/**
 * Logging utilities for vault platform
 */
declare const LOG_LEVELS: {
  readonly DEBUG: 0;
  readonly INFO: 1;
  readonly WARN: 2;
  readonly ERROR: 3;
};
export type LogLevel = keyof typeof LOG_LEVELS;
declare class Logger {
  private level;
  constructor(level?: LogLevel);
  private formatMessage;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error | any): void;
  setLevel(level: LogLevel): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map
