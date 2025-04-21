import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import logger, { LogLevel } from "./lib/error-logger";

// Initialize error logging system
logger.configure({ 
  minLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.ERROR,
  enableConsole: true,
  enableRemote: import.meta.env.PROD, // Only log to remote in production
  remoteEndpoint: '/api/log' // Will be implemented on the server side
});

// Set up global error handlers
logger.setupGlobalHandlers();

// Log application startup
logger.info("Application starting", { 
  version: import.meta.env.VITE_APP_VERSION || "development",
  environment: import.meta.env.DEV ? "development" : "production",
  timestamp: new Date().toISOString()
});

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
