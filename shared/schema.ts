import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  pterodactylId: integer("pterodactyl_id").unique(),
  pterodactylApiKey: text("pterodactyl_api_key"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  verificationToken: text("verification_token"),
  verified: boolean("verified").default(false),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Server model
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  pterodactylId: text("pterodactyl_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  node: text("node"),
  gameType: text("game_type"),
  status: text("status").notNull().default("offline"),
  ipAddress: text("ip_address").notNull(),
  port: integer("port").notNull(),
  memoryLimit: integer("memory_limit").notNull(),
  diskLimit: integer("disk_limit").notNull(),
  cpuLimit: integer("cpu_limit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Server Stats model
export const serverStats = pgTable("server_stats", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  cpuUsage: real("cpu_usage"),
  ramUsage: real("ram_usage"),
  diskUsage: real("disk_usage"),
  state: text("state"),
});

// Ticket model
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TicketReply model
export const ticketReplies = pgTable("ticket_replies", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  isStaff: boolean("is_staff").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plan model
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  memoryLimit: integer("memory_limit").notNull(),
  diskLimit: integer("disk_limit").notNull(),
  cpuLimit: integer("cpu_limit").notNull(),
  serverLimit: integer("server_limit").notNull(),
  backupLimit: integer("backup_limit").notNull(),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
});

// User subscription model
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  planId: integer("plan_id").notNull(),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
});

// Invoice model
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  dueDate: timestamp("due_date"),
  description: text("description"),
});

// Login history model
export const loginHistory = pgTable("login_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  successful: boolean("successful").default(true),
});

// API key model
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Create insert schemas for entities
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  pterodactylId: true,
  pterodactylApiKey: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
  // Keep verificationToken to allow setting during registration
  verified: true,
  resetToken: true,
  resetTokenExpiry: true,
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketReplySchema = createInsertSchema(ticketReplies).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

// Types for models
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type ServerStat = typeof serverStats.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type LoginHistory = typeof loginHistory.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
