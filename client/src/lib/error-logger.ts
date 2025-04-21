/**
 * Error logging utility for Nexora client
 * Centralizes error handling and provides consistent error reporting
 */

/**
 * Log levels for the application
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

/**
 * Interface for log entries
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Configuration for the logger
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.ERROR,
  enableConsole: true,
  enableRemote: false
};

let config: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 * @param newConfig - New configuration to apply
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Internal function to create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    stack: error?.stack
  };
}

/**
 * Internal function to process a log entry
 */
function processLogEntry(entry: LogEntry): void {
  if (shouldLog(entry.level)) {
    if (config.enableConsole) {
      logToConsole(entry);
    }

    if (config.enableRemote && config.remoteEndpoint) {
      logToRemote(entry);
    }
  }
}

/**
 * Check if the log level should be logged based on the configuration
 */
function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const configLevelIndex = levels.indexOf(config.minLevel);
  const logLevelIndex = levels.indexOf(level);
  return logLevelIndex >= configLevelIndex;
}

/**
 * Log to the console
 */
function logToConsole(entry: LogEntry): void {
  const { level, message, context, stack } = entry;
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(`[ERROR] ${message}`, context || '', stack ? `\n${stack}` : '');
      break;
    case LogLevel.WARN:
      console.warn(`[WARN] ${message}`, context || '');
      break;
    case LogLevel.INFO:
      console.info(`[INFO] ${message}`, context || '');
      break;
    case LogLevel.DEBUG:
      console.debug(`[DEBUG] ${message}`, context || '');
      break;
  }
}

/**
 * Log to a remote endpoint
 */
async function logToRemote(entry: LogEntry): Promise<void> {
  if (!config.remoteEndpoint) return;
  
  try {
    await fetch(config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    });
  } catch (err) {
    // Fallback to console if remote logging fails
    console.error('[Logger] Failed to send log to remote endpoint', err);
  }
}

/**
 * Log an error
 */
export function logError(message: string, error?: Error, context?: Record<string, any>): void {
  const entry = createLogEntry(LogLevel.ERROR, message, context, error);
  processLogEntry(entry);
}

/**
 * Log a warning
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  const entry = createLogEntry(LogLevel.WARN, message, context);
  processLogEntry(entry);
}

/**
 * Log info
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const entry = createLogEntry(LogLevel.INFO, message, context);
  processLogEntry(entry);
}

/**
 * Log debug information
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  const entry = createLogEntry(LogLevel.DEBUG, message, context);
  processLogEntry(entry);
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    logError('Unhandled error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logError('Unhandled promise rejection', error);
  });
}

// Default export for convenience
export default {
  error: logError,
  warn: logWarning,
  info: logInfo,
  debug: logDebug,
  configure: configureLogger,
  setupGlobalHandlers: setupGlobalErrorHandlers
};