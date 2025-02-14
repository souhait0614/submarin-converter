const logLevels: {
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
} = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const satisfies Partial<Record<keyof typeof console, number>>;

export type LogLevels = keyof typeof logLevels;
export type LoggerFunctions = Record<
  LogLevels,
  (message: string, ...args: unknown[]) => void
>;

export class Logger {
  private readonly level: number;
  private readonly loggerFunctions: LoggerFunctions = console;

  constructor(level: LogLevels, logger?: Partial<LoggerFunctions>) {
    this.level = logLevels[level] ?? logLevels["info"];
    this.loggerFunctions = {
      ...this.loggerFunctions,
      ...logger,
    };
  }

  private log(level: LogLevels, message: string, ...args: unknown[]) {
    if (logLevels[level] <= this.level) {
      this.loggerFunctions[level](`[SubmarinConverter] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    this.log("error", message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log("warn", message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log("info", message, ...args);
  }

  debug(message: string, ...args: unknown[]) {
    this.log("debug", message, ...args);
  }
}
