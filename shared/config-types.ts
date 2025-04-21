/**
 * Type definitions for Nexora configuration
 */

export interface AppConfig {
  name: string;
  port: number;
  env: string;
  trustProxy: boolean;
}

export interface DatabaseConfig {
  uri?: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface SessionConfig {
  secret: string;
  maxAge: number;
}

export interface PterodactylConfig {
  baseUrl: string;
  adminApiKey?: string;
}

export interface StripeConfig {
  secretKey?: string;
  publicKey?: string;
  webhookSecret?: string;
  pricePlanId?: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  session: SessionConfig;
  pterodactyl: PterodactylConfig;
  stripe: StripeConfig;
}