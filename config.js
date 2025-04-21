/**
 * Nexora Configuration
 * 
 * This file contains all configuration for the Nexora application.
 * You can modify these values directly or use environment variables.
 * 
 * @typedef {import('./shared/config-types').Config} Config
 */
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

const config = {
  // Application settings
  app: {
    name: process.env.APP_NAME || 'Nexora',
    port: parseInt(process.env.PORT || '5000'),
    env: process.env.NODE_ENV || 'development',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },
  
  // Database configuration
  database: {
    uri: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    name: process.env.PGDATABASE || 'nexora',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres'
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'nexora-session-secret-dev-only',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || (30 * 24 * 60 * 60 * 1000).toString()) // 30 days
  },
  
  // Pterodactyl Panel API
  pterodactyl: {
    baseUrl: process.env.PTERODACTYL_URL || 'https://panel.example.com',
    adminApiKey: process.env.PTERODACTYL_ADMIN_KEY
  },
  
  // Stripe payment processing
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    pricePlanId: process.env.STRIPE_PRICE_PLAN_ID
  }
};

export default config;