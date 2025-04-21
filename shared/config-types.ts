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

export interface PterodactylPlan {
  id: string;
  name: string;
  memory: number;
  disk: number;
  cpu: number;
  swap: number;
  ioWeight: number;
  price: number;
  databases: number;
  allocations: number;
  backups: number;
}

export interface PterodactylConfig {
  baseUrl: string;
  adminApiKey?: string;
  defaultNestId: number;
  defaultEggId: number;
  defaultAllocationId: number;
  defaultNodeId: number;
  defaultImage: string;
  locations: Record<string, string>;
  plans: PterodactylPlan[];
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