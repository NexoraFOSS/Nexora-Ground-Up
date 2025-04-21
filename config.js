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
    adminApiKey: process.env.PTERODACTYL_ADMIN_KEY,
    defaultNestId: parseInt(process.env.PTERODACTYL_DEFAULT_NEST_ID || '1'),
    defaultEggId: parseInt(process.env.PTERODACTYL_DEFAULT_EGG_ID || '1'),
    defaultAllocationId: parseInt(process.env.PTERODACTYL_DEFAULT_ALLOCATION_ID || '1'),
    defaultNodeId: parseInt(process.env.PTERODACTYL_DEFAULT_NODE_ID || '1'),
    defaultImage: process.env.PTERODACTYL_DEFAULT_IMAGE || 'quay.io/pterodactyl/core:java',
    locations: JSON.parse(process.env.PTERODACTYL_LOCATIONS || '{"1":"Primary Location"}'),
    plans: [
      {
        id: 'plan-1',
        name: 'Basic',
        memory: 1024,
        disk: 10240,
        cpu: 100,
        swap: 0,
        ioWeight: 500,
        price: 5.00,
        databases: 1,
        allocations: 1,
        backups: 1
      },
      {
        id: 'plan-2',
        name: 'Premium',
        memory: 2048,
        disk: 20480,
        cpu: 200,
        swap: 0,
        ioWeight: 500,
        price: 10.00,
        databases: 2,
        allocations: 2,
        backups: 2
      },
      {
        id: 'plan-3',
        name: 'Professional',
        memory: 4096,
        disk: 40960,
        cpu: 300,
        swap: 0,
        ioWeight: 500,
        price: 20.00,
        databases: 3,
        allocations: 3,
        backups: 3
      }
    ]
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