import { 
  users, type User, type InsertUser, 
  servers, type Server, type InsertServer,
  serverStats, type ServerStat,
  tickets, type Ticket, type InsertTicket,
  ticketReplies, type TicketReply, type InsertTicketReply,
  subscriptionPlans, type SubscriptionPlan,
  userSubscriptions, type UserSubscription,
  invoices, type Invoice,
  loginHistory, type LoginHistory,
  apiKeys, type ApiKey,
  // New schema types
  serverBackups, type ServerBackup, type InsertServerBackup,
  serverLocations, type ServerLocation, type InsertServerLocation,
  serverNodes, type ServerNode, type InsertServerNode,
  serverNests, type ServerNest, type InsertServerNest,
  serverEggs, type ServerEgg, type InsertServerEgg,
  type CreateServerData
} from "@shared/schema";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { PterodactylServer, PterodactylApiResponse, ServerUsage } from "./types";
import config from "../config.js";
import { pterodactylRequest, pterodactylClientRequest } from "./pterodactyl";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updatePterodactylApiKey(id: number, apiKey: string): Promise<User>;
  
  // Authentication methods
  comparePasswords(supplied: string, stored: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
  
  // Server methods
  getServers(userId: number): Promise<Server[]>;
  getServerById(id: number): Promise<Server | undefined>;
  getServerByPterodactylId(pterodactylId: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServerStatus(id: number, status: string): Promise<Server>;
  
  // Server stats methods
  getServerStats(serverId: number): Promise<ServerStat[]>;
  createServerStat(serverId: number, usage: ServerUsage): Promise<ServerStat>;
  
  // Ticket methods
  getTickets(userId: number): Promise<Ticket[]>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  getTicketWithReplies(id: number): Promise<{ ticket: Ticket; replies: TicketReply[] } | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: number, status: string): Promise<Ticket>;
  addTicketReply(reply: InsertTicketReply): Promise<TicketReply>;
  
  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  
  // Invoice methods
  getInvoices(userId: number): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  createInvoice(userId: number, amount: number, description: string): Promise<Invoice>;
  
  // API key methods
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKey(id: number): Promise<ApiKey | undefined>;
  createApiKey(userId: number, name: string): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;
  updateApiKeyLastUsed(id: number): Promise<ApiKey>;
  
  // Login history methods
  getLoginHistory(userId: number): Promise<LoginHistory[]>;
  recordLogin(userId: number, ipAddress: string, userAgent: string, successful: boolean): Promise<LoginHistory>;

  // Pterodactyl methods
  syncPterodactylServers(userId: number, pterodactylServers: PterodactylServer[]): Promise<Server[]>;
  createPterodactylUser(userId: number): Promise<number>;
  createPterodactylServer(userId: number, serverData: CreateServerData): Promise<Server>;
  
  // Pterodactyl infrastructure methods
  getServerLocations(): Promise<ServerLocation[]>;
  getServerNodes(): Promise<ServerNode[]>;
  getServerNests(): Promise<ServerNest[]>;
  getServerEggsByNestId(nestId: number): Promise<ServerEgg[]>;
  
  // Server backups methods
  getServerBackups(serverId: number): Promise<ServerBackup[]>;
  createServerBackup(backup: InsertServerBackup): Promise<ServerBackup>;
  updateServerBackup(id: number, data: Partial<ServerBackup>): Promise<ServerBackup>;
  
  // Settings methods
  getUserSettings(userId: number): Promise<any>;

  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private serversData: Map<number, Server>;
  private serverStatsData: Map<number, ServerStat[]>;
  private ticketsData: Map<number, Ticket>;
  private ticketRepliesData: Map<number, TicketReply[]>;
  private subscriptionPlansData: Map<number, SubscriptionPlan>;
  private userSubscriptionsData: Map<number, UserSubscription>;
  private invoicesData: Map<number, Invoice>;
  private loginHistoryData: Map<number, LoginHistory[]>;
  private apiKeysData: Map<number, ApiKey>;
  private serverLocationsData: Map<number, ServerLocation>;
  private serverNodesData: Map<number, ServerNode>;
  private serverNestsData: Map<number, ServerNest>;
  private serverEggsData: Map<number, ServerEgg>;
  private serverBackupsData: Map<number, ServerBackup[]>;
  
  currentId: { [key: string]: number };
  sessionStore: SessionStore;

  constructor() {
    this.usersData = new Map();
    this.serversData = new Map();
    this.serverStatsData = new Map();
    this.ticketsData = new Map();
    this.ticketRepliesData = new Map();
    this.subscriptionPlansData = new Map();
    this.userSubscriptionsData = new Map();
    this.invoicesData = new Map();
    this.loginHistoryData = new Map();
    this.apiKeysData = new Map();
    this.serverLocationsData = new Map();
    this.serverNodesData = new Map();
    this.serverNestsData = new Map();
    this.serverEggsData = new Map();
    this.serverBackupsData = new Map();
    
    this.currentId = {
      users: 1,
      servers: 1,
      serverStats: 1,
      tickets: 1,
      ticketReplies: 1,
      subscriptionPlans: 1,
      userSubscriptions: 1,
      invoices: 1,
      loginHistory: 1,
      apiKeys: 1,
      serverBackups: 1,
      serverLocations: 1,
      serverNodes: 1,
      serverNests: 1,
      serverEggs: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Initialize subscription plans
    const basicPlan: SubscriptionPlan = {
      id: this.getNextId('subscriptionPlans'),
      name: "Basic",
      description: "For small communities or testing",
      price: 9.99,
      memoryLimit: 4096,
      diskLimit: 20480,
      cpuLimit: 100,
      serverLimit: 2,
      backupLimit: 3,
      stripeProductId: "prod_basic",
      stripePriceId: "price_basic"
    };
    
    const premiumPlan: SubscriptionPlan = {
      id: this.getNextId('subscriptionPlans'),
      name: "Premium",
      description: "For medium-sized communities",
      price: 24.99,
      memoryLimit: 16384,
      diskLimit: 51200,
      cpuLimit: 400,
      serverLimit: 5,
      backupLimit: 10,
      stripeProductId: "prod_premium",
      stripePriceId: "price_premium"
    };
    
    const professionalPlan: SubscriptionPlan = {
      id: this.getNextId('subscriptionPlans'),
      name: "Professional",
      description: "For large communities",
      price: 49.99,
      memoryLimit: 32768,
      diskLimit: 102400,
      cpuLimit: 800,
      serverLimit: 10,
      backupLimit: 0, // Unlimited
      stripeProductId: "prod_professional",
      stripePriceId: "price_professional"
    };
    
    this.subscriptionPlansData.set(basicPlan.id, basicPlan);
    this.subscriptionPlansData.set(premiumPlan.id, premiumPlan);
    this.subscriptionPlansData.set(professionalPlan.id, professionalPlan);
    
    // Initialize server locations
    const locations = [
      {
        id: this.getNextId('serverLocations'),
        locationId: 1,
        shortCode: "us",
        name: "North America",
        description: "Chicago, IL, USA"
      },
      {
        id: this.getNextId('serverLocations'),
        locationId: 2,
        shortCode: "eu",
        name: "Europe",
        description: "London, UK"
      },
      {
        id: this.getNextId('serverLocations'),
        locationId: 3,
        shortCode: "ap",
        name: "Asia Pacific",
        description: "Singapore"
      }
    ];
    
    locations.forEach(location => this.serverLocationsData.set(location.id, location));
    
    // Initialize server nodes
    const nodes = [
      {
        id: this.getNextId('serverNodes'),
        nodeId: 1,
        locationId: 1,
        name: "US Node 1",
        fqdn: "node-us1.nexora.com",
        scheme: "https",
        memory: 65536,
        memoryOverallocate: 0,
        disk: 1048576,
        diskOverallocate: 0,
        uploadLimit: 100,
        daemonBase: "/var/lib/pterodactyl/volumes",
        daemonSftp: 2022,
        daemonListen: 8080,
        maintenance: false
      },
      {
        id: this.getNextId('serverNodes'),
        nodeId: 2,
        locationId: 2,
        name: "EU Node 1",
        fqdn: "node-eu1.nexora.com",
        scheme: "https",
        memory: 65536,
        memoryOverallocate: 0,
        disk: 1048576,
        diskOverallocate: 0,
        uploadLimit: 100,
        daemonBase: "/var/lib/pterodactyl/volumes",
        daemonSftp: 2022,
        daemonListen: 8080,
        maintenance: false
      }
    ];
    
    nodes.forEach(node => this.serverNodesData.set(node.id, node));
    
    // Initialize server nests
    const nests = [
      {
        id: this.getNextId('serverNests'),
        nestId: 1,
        name: "Minecraft",
        description: "All Minecraft server types",
        author: "Nexora"
      },
      {
        id: this.getNextId('serverNests'),
        nestId: 2,
        name: "Source Engine",
        description: "Games using the Source engine",
        author: "Nexora"
      },
      {
        id: this.getNextId('serverNests'),
        nestId: 5,
        name: "Voice Servers",
        description: "Voice communication servers",
        author: "Nexora"
      }
    ];
    
    nests.forEach(nest => this.serverNestsData.set(nest.id, nest));
    
    // Initialize server eggs
    const eggs = [
      {
        id: this.getNextId('serverEggs'),
        eggId: 1,
        nestId: 1,
        name: "Vanilla Minecraft",
        description: "Minecraft Vanilla server",
        dockerImage: "ghcr.io/pterodactyl/yolks:java_17",
        config: { 
          startup: { done: "Done" },
          command: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar server.jar",
          stop: "stop" 
        },
        startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}"
      },
      {
        id: this.getNextId('serverEggs'),
        eggId: 2,
        nestId: 1,
        name: "Paper",
        description: "High performance Minecraft fork",
        dockerImage: "ghcr.io/pterodactyl/yolks:java_17",
        config: { 
          startup: { done: "Done" },
          command: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar paper.jar", 
          stop: "stop"
        },
        startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}"
      },
      {
        id: this.getNextId('serverEggs'),
        eggId: 5,
        nestId: 2,
        name: "Counter-Strike 2",
        description: "CS2 Dedicated Server",
        dockerImage: "ghcr.io/pterodactyl/games:source",
        config: { 
          startup: { done: "game server ready" },
          command: "./cs2.sh -console -game csgo +map de_dust2",
          stop: "quit"
        },
        startup: "./cs2.sh -console -game csgo +map {{SRCDS_MAP}} +ip {{SERVER_IP}} +port {{SERVER_PORT}}"
      },
      {
        id: this.getNextId('serverEggs'),
        eggId: 15,
        nestId: 5,
        name: "Teamspeak 3",
        description: "Teamspeak 3 voice server",
        dockerImage: "ghcr.io/pterodactyl/yolks:debian",
        config: { 
          startup: { done: "listening on" },
          command: "./ts3server_minimal_runscript.sh",
          stop: "q"
        },
        startup: "./ts3server_minimal_runscript.sh license_accepted=1 query_port={{SERVER_PORT}} filetransfer_port={{FILE_TRANSFER}} port={{VOICE_PORT}}"
      }
    ];
    
    eggs.forEach(egg => this.serverEggsData.set(egg.id, egg));
  }

  private getNextId(entityName: string): number {
    const id = this.currentId[entityName]++;
    return id;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getNextId('users');
    const now = new Date();
    
    // Hash the password if it's not already hashed
    let password = insertUser.password;
    if (!password.includes('.')) {
      password = await this.hashPassword(password);
    }
    
    const user: User = { 
      ...insertUser, 
      id,
      password,
      createdAt: now,
      verified: false,
      twoFactorEnabled: false,
      // Add all required fields with appropriate defaults
      pterodactylId: null,
      pterodactylApiKey: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
      twoFactorSecret: null,
      fullName: insertUser.fullName || null
    };
    
    this.usersData.set(id, user);
    
    // Create a default subscription for the user
    const premiumPlan = Array.from(this.subscriptionPlansData.values()).find(plan => plan.name === "Premium");
    
    if (premiumPlan) {
      const subscription: UserSubscription = {
        id: this.getNextId('userSubscriptions'),
        userId: user.id,
        planId: premiumPlan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days later
        cancelAtPeriodEnd: false
      };
      
      this.userSubscriptionsData.set(subscription.id, subscription);
    }
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    
    return updatedUser;
  }
  
  async updatePterodactylApiKey(id: number, apiKey: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, pterodactylApiKey: apiKey };
    this.usersData.set(id, updatedUser);
    
    return updatedUser;
  }
  
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    // Verify current password
    const isMatch = await this.comparePasswords(currentPassword, user.password);
    if (!isMatch) {
      return false;
    }
    
    // Hash and update new password
    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    this.usersData.set(userId, user);
    
    return true;
  }

  async getServers(userId: number): Promise<Server[]> {
    return Array.from(this.serversData.values()).filter(
      (server) => server.userId === userId,
    );
  }

  async getServerById(id: number): Promise<Server | undefined> {
    return this.serversData.get(id);
  }

  async getServerByPterodactylId(pterodactylId: string): Promise<Server | undefined> {
    return Array.from(this.serversData.values()).find(
      (server) => server.pterodactylId === pterodactylId,
    );
  }

  async createServer(server: InsertServer): Promise<Server> {
    const id = this.getNextId('servers');
    const now = new Date();
    
    const newServer: Server = { 
      ...server, 
      id,
      createdAt: now,
      // Ensure all required fields are properly set with defaults
      status: server.status || "installing",
      description: server.description || null,
      node: server.node || null,
      gameType: server.gameType || null
    };
    
    this.serversData.set(id, newServer);
    
    // Initialize empty stats array for this server
    this.serverStatsData.set(id, []);
    
    return newServer;
  }

  async updateServerStatus(id: number, status: string): Promise<Server> {
    const server = await this.getServerById(id);
    if (!server) {
      throw new Error(`Server with ID ${id} not found`);
    }
    
    server.status = status;
    this.serversData.set(id, server);
    
    return server;
  }

  async getServerStats(serverId: number): Promise<ServerStat[]> {
    return this.serverStatsData.get(serverId) || [];
  }

  async createServerStat(serverId: number, usage: ServerUsage): Promise<ServerStat> {
    const id = this.getNextId('serverStats');
    const now = new Date();
    
    const stat: ServerStat = {
      id,
      serverId,
      timestamp: now,
      cpuUsage: usage.cpu,
      ramUsage: usage.memory,
      diskUsage: usage.disk,
      state: usage.state
    };
    
    const currentStats = this.serverStatsData.get(serverId) || [];
    currentStats.push(stat);
    
    // Keep only the latest 100 stats
    if (currentStats.length > 100) {
      currentStats.shift();
    }
    
    this.serverStatsData.set(serverId, currentStats);
    
    return stat;
  }

  async getTickets(userId: number): Promise<Ticket[]> {
    return Array.from(this.ticketsData.values()).filter(
      (ticket) => ticket.userId === userId,
    );
  }

  async getTicketById(id: number): Promise<Ticket | undefined> {
    return this.ticketsData.get(id);
  }

  async getTicketWithReplies(id: number): Promise<{ ticket: Ticket; replies: TicketReply[] } | undefined> {
    const ticket = await this.getTicketById(id);
    if (!ticket) {
      return undefined;
    }
    
    const replies = this.ticketRepliesData.get(id) || [];
    
    return { ticket, replies };
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const id = this.getNextId('tickets');
    const now = new Date();
    
    const newTicket: Ticket = { 
      ...ticket, 
      id,
      createdAt: now,
      updatedAt: now,
      status: "open",
      // Ensure priority is set
      priority: ticket.priority || "medium"
    };
    
    this.ticketsData.set(id, newTicket);
    
    // Initialize empty replies array for this ticket
    this.ticketRepliesData.set(id, []);
    
    return newTicket;
  }

  async updateTicketStatus(id: number, status: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }
    
    ticket.status = status;
    ticket.updatedAt = new Date();
    this.ticketsData.set(id, ticket);
    
    return ticket;
  }

  async addTicketReply(reply: InsertTicketReply): Promise<TicketReply> {
    const id = this.getNextId('ticketReplies');
    const now = new Date();
    
    const newReply: TicketReply = { 
      ...reply, 
      id,
      createdAt: now,
      // Ensure isStaff is set
      isStaff: reply.isStaff || false
    };
    
    const replies = this.ticketRepliesData.get(reply.ticketId) || [];
    replies.push(newReply);
    this.ticketRepliesData.set(reply.ticketId, replies);
    
    // Update the ticket's updatedAt timestamp
    const ticket = await this.getTicketById(reply.ticketId);
    if (ticket) {
      ticket.updatedAt = now;
      this.ticketsData.set(reply.ticketId, ticket);
    }
    
    return newReply;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlansData.values());
  }

  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlansData.get(id);
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    return Array.from(this.userSubscriptionsData.values()).find(
      (sub) => sub.userId === userId,
    );
  }

  async getInvoices(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoicesData.values()).filter(
      (invoice) => invoice.userId === userId,
    );
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    return this.invoicesData.get(id);
  }

  async createInvoice(userId: number, amount: number, description: string): Promise<Invoice> {
    const id = this.getNextId('invoices');
    const now = new Date();
    
    const invoice: Invoice = {
      id,
      userId,
      stripeInvoiceId: `inv_${randomBytes(10).toString('hex')}`,
      amount,
      currency: "usd",
      status: "paid",
      paidAt: now,
      createdAt: now,
      dueDate: now,
      description
    };
    
    this.invoicesData.set(id, invoice);
    
    return invoice;
  }

  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeysData.values()).filter(
      (key) => key.userId === userId,
    );
  }

  async getApiKey(id: number): Promise<ApiKey | undefined> {
    return this.apiKeysData.get(id);
  }

  async createApiKey(userId: number, name: string): Promise<ApiKey> {
    const id = this.getNextId('apiKeys');
    const now = new Date();
    const token = `nxr_${randomBytes(32).toString('hex')}`;
    
    const apiKey: ApiKey = {
      id,
      userId,
      name,
      token,
      createdAt: now,
      lastUsed: null,
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    };
    
    this.apiKeysData.set(id, apiKey);
    
    return apiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    this.apiKeysData.delete(id);
  }

  async updateApiKeyLastUsed(id: number): Promise<ApiKey> {
    const apiKey = await this.getApiKey(id);
    if (!apiKey) {
      throw new Error(`API key with ID ${id} not found`);
    }
    
    apiKey.lastUsed = new Date();
    this.apiKeysData.set(id, apiKey);
    
    return apiKey;
  }

  async getLoginHistory(userId: number): Promise<LoginHistory[]> {
    return this.loginHistoryData.get(userId) || [];
  }

  async recordLogin(userId: number, ipAddress: string, userAgent: string, successful: boolean): Promise<LoginHistory> {
    const id = this.getNextId('loginHistory');
    const now = new Date();
    
    const loginRecord: LoginHistory = {
      id,
      userId,
      ipAddress,
      userAgent,
      createdAt: now,
      successful
    };
    
    const history = this.loginHistoryData.get(userId) || [];
    history.push(loginRecord);
    this.loginHistoryData.set(userId, history);
    
    return loginRecord;
  }

  async syncPterodactylServers(userId: number, pterodactylServers: PterodactylServer[]): Promise<Server[]> {
    const existingServers = await this.getServers(userId);
    const existingServersByPterodactylId = new Map<string, Server>();
    existingServers.forEach(server => existingServersByPterodactylId.set(server.pterodactylId, server));
    
    const syncedServers: Server[] = [];
    
    // Process each server from Pterodactyl
    for (const ptero of pterodactylServers) {
      const pterodactylId = ptero.attributes.identifier;
      const existingServer = existingServersByPterodactylId.get(pterodactylId);
      
      // Determine game type based on nest/egg IDs
      const gameType = `${ptero.attributes.nest}/${ptero.attributes.egg}`;
      
      if (existingServer) {
        // Update existing server with latest data from Pterodactyl
        const updatedServer = {
          ...existingServer,
          name: ptero.attributes.name,
          description: ptero.attributes.description || existingServer.description,
          node: ptero.attributes.node,
          gameType: gameType,
          status: ptero.attributes.status.toLowerCase(),
          ipAddress: ptero.attributes.allocation.ip,
          port: ptero.attributes.allocation.port,
          memoryLimit: ptero.attributes.limits.memory,
          diskLimit: ptero.attributes.limits.disk,
          cpuLimit: ptero.attributes.limits.cpu
        };
        
        this.serversData.set(existingServer.id, updatedServer);
        syncedServers.push(updatedServer);
      } else {
        // Create new server record in our database
        const newServer: InsertServer = {
          userId,
          pterodactylId,
          name: ptero.attributes.name,
          description: ptero.attributes.description || "",
          node: ptero.attributes.node,
          gameType: gameType,
          status: ptero.attributes.status.toLowerCase(),
          ipAddress: ptero.attributes.allocation.ip,
          port: ptero.attributes.allocation.port,
          memoryLimit: ptero.attributes.limits.memory,
          diskLimit: ptero.attributes.limits.disk,
          cpuLimit: ptero.attributes.limits.cpu
        };
        
        const createdServer = await this.createServer(newServer);
        syncedServers.push(createdServer);
      }
    }
    
    // Check for servers that exist in our database but not in Pterodactyl anymore
    // These would be servers that were deleted directly in Pterodactyl
    const pterodactylIds = new Set(pterodactylServers.map(s => s.attributes.identifier));
    const missingServers = existingServers.filter(server => !pterodactylIds.has(server.pterodactylId));
    
    // Update status of missing servers to "deleted" or similar
    for (const server of missingServers) {
      const updatedServer = await this.updateServerStatus(server.id, "deleted");
      syncedServers.push(updatedServer);
    }
    
    return syncedServers;
  }

  async getUserSettings(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // For now, just return a subset of user data as settings
    return {
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      twoFactorEnabled: user.twoFactorEnabled,
      pterodactylApiKey: user.pterodactylApiKey ? "•••••••••••••••••••" : null
    };
  }

  // Implementation for new Pterodactyl API integration methods
  async createPterodactylUser(userId: number): Promise<number> {
    // This method creates a new user in Pterodactyl and returns the Pterodactyl user ID
    
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    if (!config.pterodactyl.adminApiKey) {
      throw new Error("Pterodactyl admin API key is not configured");
    }
    
    // Prepare the request to Pterodactyl API
    const pterodactylEndpoint = "users";
    const method = "POST";
    const apiKey = config.pterodactyl.adminApiKey;
    
    const body = {
      username: user.username,
      email: user.email,
      first_name: user.fullName ? user.fullName.split(" ")[0] : user.username,
      last_name: user.fullName ? user.fullName.split(" ").slice(1).join(" ") : "",
      language: "en",
      root_admin: false,
      password: randomBytes(16).toString("hex") // Generate a random password (user will use client app)
    };
    
    try {
      // Make the request to Pterodactyl API using the helper function
      const response = await pterodactylRequest(pterodactylEndpoint, apiKey, method, body) as any;
      
      if (!response.attributes || !response.attributes.id) {
        throw new Error("Invalid response format from Pterodactyl API");
      }
      
      const pterodactylId = response.attributes.id;
      
      // Update the user with the new Pterodactyl ID
      const updatedUser = { ...user, pterodactylId };
      this.usersData.set(userId, updatedUser);
      
      return pterodactylId;
    } catch (error) {
      // Handle specific Pterodactyl API errors
      throw new Error(`Failed to create user in Pterodactyl: ${error.message}`);
    }
  }
  
  async createPterodactylServer(userId: number, serverData: CreateServerData): Promise<Server> {
    // Creates a new server via the Pterodactyl API and stores a reference in our database
    
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Check if the user has a Pterodactyl ID
    if (!user.pterodactylId) {
      // Create a new Pterodactyl user if user doesn't have one
      await this.createPterodactylUser(userId);
      // Refresh user data
      const updatedUser = await this.getUser(userId);
      if (!updatedUser || !updatedUser.pterodactylId) {
        throw new Error("Failed to create Pterodactyl user");
      }
      user.pterodactylId = updatedUser.pterodactylId;
    }
    
    if (!config.pterodactyl.adminApiKey) {
      throw new Error("Pterodactyl admin API key is not configured");
    }
    
    // Prepare the server creation request
    const endpoint = "servers";
    const method = "POST";
    const apiKey = config.pterodactyl.adminApiKey;
    
    // Map plan limits to Pterodactyl server allocation
    const userSub = await this.getUserSubscription(userId);
    if (!userSub) {
      throw new Error("User does not have an active subscription");
    }
    
    const plan = await this.getSubscriptionPlanById(userSub.planId);
    if (!plan) {
      throw new Error("Subscription plan not found");
    }
    
    // Use the selected egg to get docker image and startup information
    const egg = (await this.getServerEggsByNestId(serverData.nestId))
      .find(e => e.eggId === serverData.eggId);
    
    if (!egg) {
      throw new Error(`Server egg not found: nest ${serverData.nestId}, egg ${serverData.eggId}`);
    }
    
    // Create the server creation payload for Pterodactyl
    const serverCreationPayload = {
      name: serverData.name,
      user: user.pterodactylId,
      egg: serverData.eggId,
      docker_image: egg.dockerImage,
      startup: egg.startup,
      environment: serverData.environment || {},
      limits: {
        memory: serverData.memory,
        swap: 0,
        disk: serverData.disk,
        io: 500,
        cpu: serverData.cpu
      },
      feature_limits: {
        databases: 2,
        allocations: 1,
        backups: plan.backupLimit === 0 ? 10 : plan.backupLimit // Convert unlimited (0) to 10
      },
      allocation: {
        default: config.pterodactyl.defaultAllocationId
      },
      deploy: {
        locations: [serverData.locationId],
        dedicated_ip: false,
        port_range: []
      }
    };
    
    try {
      // Make the request to Pterodactyl API
      const response = await pterodactylRequest(endpoint, apiKey, method, serverCreationPayload) as any;
      
      if (!response.attributes) {
        throw new Error("Invalid response format from Pterodactyl API");
      }
      
      // Extract server data from response
      const pterodactylServerData = response.attributes;
      
      // Create a record in our database
      const newServer: InsertServer = {
        userId,
        pterodactylId: pterodactylServerData.identifier,
        name: pterodactylServerData.name,
        description: pterodactylServerData.description || "",
        node: pterodactylServerData.node,
        gameType: `${serverData.nestId}/${serverData.eggId}`,
        status: pterodactylServerData.status,
        ipAddress: pterodactylServerData.allocation?.ip || "pending",
        port: pterodactylServerData.allocation?.port || 0,
        memoryLimit: pterodactylServerData.limits.memory,
        diskLimit: pterodactylServerData.limits.disk,
        cpuLimit: pterodactylServerData.limits.cpu,
      };
      
      return await this.createServer(newServer);
    } catch (error: any) {
      throw new Error(`Failed to create server in Pterodactyl: ${error.message}`);
    }
  }
  
  // Server location methods
  async getServerLocations(): Promise<ServerLocation[]> {
    // Try to fetch from Pterodactyl API if admin API key is available
    if (config.pterodactyl.adminApiKey) {
      try {
        const endpoint = "locations";
        const apiKey = config.pterodactyl.adminApiKey;
        
        const response = await pterodactylRequest(endpoint, apiKey);
        
        if (response.data && Array.isArray(response.data)) {
          // Clear existing data
          this.serverLocationsData.clear();
          
          // Process and store the locations
          const locations: ServerLocation[] = [];
          for (const item of response.data) {
            const locationId = this.getNextId('serverLocations');
            const location: ServerLocation = {
              id: locationId,
              locationId: item.attributes.id,
              shortCode: item.attributes.short,
              name: item.attributes.long || item.attributes.short,
              description: item.attributes.description || ""
            };
            
            this.serverLocationsData.set(locationId, location);
            locations.push(location);
          }
          
          return locations;
        }
      } catch (error) {
        // If API request fails, fall back to stored data
        console.error("Failed to fetch locations from Pterodactyl API:", error);
      }
    }
    
    // Fall back to stored data if API request fails or admin key is not available
    return Array.from(this.serverLocationsData.values());
  }
  
  // Server nodes methods
  async getServerNodes(): Promise<ServerNode[]> {
    // Try to fetch from Pterodactyl API if admin API key is available
    if (config.pterodactyl.adminApiKey) {
      try {
        const endpoint = "nodes";
        const apiKey = config.pterodactyl.adminApiKey;
        
        const response = await pterodactylRequest(endpoint, apiKey);
        
        if (response.data && Array.isArray(response.data)) {
          // Clear existing data
          this.serverNodesData.clear();
          
          // Process and store the nodes
          const nodes: ServerNode[] = [];
          for (const item of response.data) {
            const nodeId = this.getNextId('serverNodes');
            const node: ServerNode = {
              id: nodeId,
              nodeId: item.attributes.id,
              locationId: item.attributes.location_id,
              name: item.attributes.name,
              fqdn: item.attributes.fqdn,
              scheme: item.attributes.scheme,
              memory: item.attributes.memory,
              memoryOverallocate: item.attributes.memory_overallocate,
              disk: item.attributes.disk,
              diskOverallocate: item.attributes.disk_overallocate,
              uploadLimit: item.attributes.upload_size,
              daemonBase: item.attributes.daemon_base,
              daemonSftp: item.attributes.daemon_sftp,
              daemonListen: item.attributes.daemon_listen,
              maintenance: item.attributes.maintenance_mode
            };
            
            this.serverNodesData.set(nodeId, node);
            nodes.push(node);
          }
          
          return nodes;
        }
      } catch (error) {
        // If API request fails, fall back to stored data
        console.error("Failed to fetch nodes from Pterodactyl API:", error);
      }
    }
    
    // Fall back to stored data if API request fails or admin key is not available
    return Array.from(this.serverNodesData.values());
  }
  
  // Server nests methods
  async getServerNests(): Promise<ServerNest[]> {
    // Try to fetch from Pterodactyl API if admin API key is available
    if (config.pterodactyl.adminApiKey) {
      try {
        const endpoint = "nests";
        const apiKey = config.pterodactyl.adminApiKey;
        
        const response = await pterodactylRequest(endpoint, apiKey);
        
        if (response.data && Array.isArray(response.data)) {
          // Clear existing data
          this.serverNestsData.clear();
          
          // Process and store the nests
          const nests: ServerNest[] = [];
          for (const item of response.data) {
            const nestId = this.getNextId('serverNests');
            const nest: ServerNest = {
              id: nestId,
              nestId: item.attributes.id,
              name: item.attributes.name,
              description: item.attributes.description,
              author: item.attributes.author
            };
            
            this.serverNestsData.set(nestId, nest);
            nests.push(nest);
          }
          
          return nests;
        }
      } catch (error) {
        // If API request fails, fall back to stored data
        console.error("Failed to fetch nests from Pterodactyl API:", error);
      }
    }
    
    // Fall back to stored data if API request fails or admin key is not available
    return Array.from(this.serverNestsData.values());
  }
  
  // Server eggs methods
  async getServerEggsByNestId(nestId: number): Promise<ServerEgg[]> {
    // Try to fetch from Pterodactyl API if admin API key is available
    if (config.pterodactyl.adminApiKey) {
      try {
        const endpoint = `nests/${nestId}/eggs`;
        const apiKey = config.pterodactyl.adminApiKey;
        
        const response = await pterodactylRequest(endpoint, apiKey);
        
        if (response.data && Array.isArray(response.data)) {
          // Clear existing eggs for this nest
          const eggsToRemove = Array.from(this.serverEggsData.values())
            .filter(egg => egg.nestId === nestId)
            .map(egg => egg.id);
          
          eggsToRemove.forEach(id => this.serverEggsData.delete(id));
          
          // Process and store the eggs
          const eggs: ServerEgg[] = [];
          for (const item of response.data) {
            const eggId = this.getNextId('serverEggs');
            const egg: ServerEgg = {
              id: eggId,
              eggId: item.attributes.id,
              nestId,
              name: item.attributes.name,
              description: item.attributes.description,
              dockerImage: item.attributes.docker_image,
              config: item.attributes.config || {},
              startup: item.attributes.startup
            };
            
            this.serverEggsData.set(eggId, egg);
            eggs.push(egg);
          }
          
          return eggs;
        }
      } catch (error) {
        // If API request fails, fall back to stored data
        console.error(`Failed to fetch eggs for nest ${nestId} from Pterodactyl API:`, error);
      }
    }
    
    // Fall back to stored data if API request fails or admin key is not available
    return Array.from(this.serverEggsData.values()).filter(egg => egg.nestId === nestId);
  }
  
  // Server backups methods
  async getServerBackups(serverId: number): Promise<ServerBackup[]> {
    return this.serverBackupsData.get(serverId) || [];
  }
  
  async createServerBackup(backup: InsertServerBackup): Promise<ServerBackup> {
    const id = this.getNextId('serverBackups');
    const now = new Date();
    
    const newBackup: ServerBackup = {
      ...backup,
      id,
      createdAt: now,
      completed: false,
      completedAt: null,
      // Ensure all required fields are properly set
      name: backup.name || null,
      url: backup.url || null,
      size: backup.size || null
    };
    
    const backups = this.serverBackupsData.get(backup.serverId) || [];
    backups.push(newBackup);
    this.serverBackupsData.set(backup.serverId, backups);
    
    return newBackup;
  }
  
  async updateServerBackup(id: number, data: Partial<ServerBackup>): Promise<ServerBackup> {
    // Find the backup across all servers
    let targetBackup: ServerBackup | null = null;
    let serverId: number | null = null;
    
    for (const [sid, backups] of this.serverBackupsData.entries()) {
      const backup = backups.find(b => b.id === id);
      if (backup) {
        targetBackup = backup;
        serverId = sid;
        break;
      }
    }
    
    if (!targetBackup || serverId === null) {
      throw new Error(`Backup with ID ${id} not found`);
    }
    
    // Update the backup
    const updatedBackup = { ...targetBackup, ...data };
    
    // Replace in the collection
    const backups = this.serverBackupsData.get(serverId) || [];
    const index = backups.findIndex(b => b.id === id);
    if (index !== -1) {
      backups[index] = updatedBackup;
      this.serverBackupsData.set(serverId, backups);
    }
    
    return updatedBackup;
  }
}

export const storage = new MemStorage();
