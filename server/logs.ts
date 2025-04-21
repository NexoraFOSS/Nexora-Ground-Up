/**
 * Log handling endpoints
 * Provides API for client log collection and server-side error reporting
 */

import { Request, Response, Express, NextFunction } from 'express';
import logger from './utils/logger';

// Create a module-specific logger
const log = logger.createLogger('logs');

// Define the expected log entry structure from clients
interface ClientLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
  stack?: string;
  user?: string | number;
  userAgent?: string;
  url?: string;
}

// Set up logging endpoints and middleware
export function setupLogging(app: Express) {
  // Error handling middleware - should be registered last in the chain
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const status = res.statusCode !== 200 ? res.statusCode : 500;
    
    // Log the error with context about the request
    log.error(`Uncaught exception in request handler`, err, {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Send a clean response
    res.status(status).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    });
  });

  // Request logging middleware - logs all requests
  app.use(logger.requestLogger());

  // Endpoint for client logs
  app.post('/api/log', (req: Request, res: Response) => {
    try {
      const logEntry: ClientLogEntry = req.body;
      
      if (!logEntry || !logEntry.level || !logEntry.message) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid log entry format'
        });
      }
      
      // Enhance log entry with request data
      const enhancedEntry = {
        ...logEntry,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      };
      
      // Log the entry at the appropriate level
      switch (logEntry.level.toLowerCase()) {
        case 'error':
          const error = logEntry.stack ? new Error(logEntry.message) : undefined;
          if (error) {
            error.stack = logEntry.stack;
          }
          log.error(`[Client] ${logEntry.message}`, error, enhancedEntry.context);
          break;
        case 'warn':
          log.warn(`[Client] ${logEntry.message}`, enhancedEntry.context);
          break;
        case 'info':
          log.info(`[Client] ${logEntry.message}`, enhancedEntry.context);
          break;
        case 'debug':
          log.debug(`[Client] ${logEntry.message}`, enhancedEntry.context);
          break;
        default:
          log.info(`[Client] ${logEntry.message}`, enhancedEntry.context);
      }
      
      res.status(202).json({ status: 'success' });
    } catch (err) {
      log.error('Error processing client log entry', err instanceof Error ? err : new Error(String(err)));
      res.status(500).json({ status: 'error', message: 'Failed to process log entry' });
    }
  });
  
  // Log API health status
  app.get('/api/log/health', (req: Request, res: Response) => {
    log.info('Log health check');
    res.status(200).json({ status: 'healthy' });
  });
}