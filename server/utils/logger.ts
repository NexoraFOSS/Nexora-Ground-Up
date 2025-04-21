/**
 * Server-side logging utility for Nexora
 * Provides consistent logging across the server application
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Interface for logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  timestamps: boolean;
  colors: boolean;
}

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  timestamps: true,
  colors: process.env.NODE_ENV !== 'production'
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Current configuration
let config: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 * @param newConfig - New configuration to apply
 */
export function configure(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get timestamp string for logs
 */
function getTimestamp(): string {
  return config.timestamps ? `${colors.dim}${new Date().toISOString()}${colors.reset} ` : '';
}

/**
 * Format a log message with colors if enabled
 */
function formatMessage(level: string, message: string, context?: any): string {
  let levelColor = '';
  let contextStr = '';
  
  if (config.colors) {
    switch (level) {
      case 'DEBUG': levelColor = colors.blue; break;
      case 'INFO': levelColor = colors.green; break;
      case 'WARN': levelColor = colors.yellow; break;
      case 'ERROR': levelColor = colors.red; break;
    }
  }
  
  if (context) {
    try {
      contextStr = typeof context === 'string' 
        ? context 
        : ' ' + JSON.stringify(context, null, 2);
    } catch (err) {
      contextStr = ' [Error: Could not stringify context]';
    }
  }
  
  const levelStr = config.colors 
    ? `${levelColor}[${level}]${colors.reset}` 
    : `[${level}]`;
  
  return `${getTimestamp()}${levelStr} ${message}${contextStr}`;
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: any): void {
  if (config.minLevel <= LogLevel.DEBUG) {
    console.debug(formatMessage('DEBUG', message, context));
  }
}

/**
 * Log an informational message
 */
export function info(message: string, context?: any): void {
  if (config.minLevel <= LogLevel.INFO) {
    console.info(formatMessage('INFO', message, context));
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: any): void {
  if (config.minLevel <= LogLevel.WARN) {
    console.warn(formatMessage('WARN', message, context));
  }
}

/**
 * Log an error message
 */
export function error(message: string, error?: Error | unknown, context?: any): void {
  if (config.minLevel <= LogLevel.ERROR) {
    const errorObj = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    const errorMessage = errorObj ? `${message}: ${errorObj.message}` : message;
    
    console.error(formatMessage('ERROR', errorMessage, context));
    
    if (errorObj?.stack) {
      console.error(config.colors ? `${colors.dim}${errorObj.stack}${colors.reset}` : errorObj.stack);
    }
  }
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: any) => debug(`[${module}] ${message}`, context),
    info: (message: string, context?: any) => info(`[${module}] ${message}`, context),
    warn: (message: string, context?: any) => warn(`[${module}] ${message}`, context),
    error: (message: string, err?: Error | unknown, context?: any) => {
      // Properly handle the unknown error type
      const typedError = err instanceof Error ? err : err ? new Error(String(err)) : undefined;
      error(`[${module}] ${message}`, typedError, context);
    }
  };
}

// Express middleware for request logging
export function requestLogger(source = 'express') {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    // Log when the request is complete
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : 
                   res.statusCode >= 400 ? 'warn' : 'info';
      
      const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`;
      
      if (level === 'error') {
        error(`[${source}] ${message}`);
      } else if (level === 'warn') {
        warn(`[${source}] ${message}`);
      } else {
        info(`[${source}] ${message}`);
      }
    });
    
    next();
  };
}

export default {
  debug,
  info,
  warn,
  error,
  configure,
  createLogger,
  requestLogger,
  LogLevel
};