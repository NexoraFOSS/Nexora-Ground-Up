import { Express, Request, Response } from "express";
import fetch from "node-fetch";
import { storage } from "./storage";
import { PterodactylServer, PterodactylApiResponse, ServerUsage, PterodactylResourceResponse } from "./types";
import config from "../config.js";
import type { Config } from "../shared/config-types";
import logger from "./utils/logger";

// Create a module-specific logger
const log = logger.createLogger("pterodactyl");

// Helper function to make API requests to Pterodactyl
async function pterodactylRequest(
  endpoint: string,
  apiKey: string,
  method: string = "GET",
  body?: any
) {
  try {
    log.debug(`Making Pterodactyl admin API request: ${method} ${endpoint}`);
    
    if (!config.pterodactyl.baseUrl) {
      throw new Error("Pterodactyl base URL is not configured");
    }

    const url = `${config.pterodactyl.baseUrl}/api/application/${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Pterodactyl API error: ${response.status} ${errorText}`);
      log.error(`Pterodactyl API error for ${method} ${endpoint}`, error, {
        status: response.status,
        url: url,
        responseText: errorText.substring(0, 200) // Truncate potentially large error messages
      });
      throw error;
    }

    const data = await response.json();
    log.debug(`Successful Pterodactyl admin API response: ${method} ${endpoint}`);
    return data;
  } catch (error) {
    log.error(`Pterodactyl API request failed for ${method} ${endpoint}`, error);
    throw error;
  }
}

// Helper function for client API requests (using user's API key)
async function pterodactylClientRequest(
  endpoint: string,
  apiKey: string,
  method: string = "GET",
  body?: any
) {
  try {
    log.debug(`Making Pterodactyl client API request: ${method} ${endpoint}`);
    
    if (!config.pterodactyl.baseUrl) {
      throw new Error("Pterodactyl base URL is not configured");
    }

    const url = `${config.pterodactyl.baseUrl}/api/client/${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Pterodactyl API error: ${response.status} ${errorText}`);
      log.error(`Pterodactyl client API error for ${method} ${endpoint}`, error, {
        status: response.status,
        url: url,
        responseText: errorText.substring(0, 200) // Truncate potentially large error messages
      });
      throw error;
    }

    const data = await response.json();
    log.debug(`Successful Pterodactyl client API response: ${method} ${endpoint}`);
    return data;
  } catch (error) {
    log.error(`Pterodactyl client API request failed for ${method} ${endpoint}`, error);
    throw error;
  }
}

export function setupPterodactyl(app: Express) {
  // List servers for authenticated user
  app.get("/api/servers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn("Unauthorized access attempt to /api/servers");
      return res.status(401).send("Unauthorized");
    }

    try {
      log.info(`User ${req.user.id} requested server list`);
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Fetch servers from Pterodactyl
      log.debug(`Fetching servers for user ${req.user.id} from Pterodactyl`);
      const serversResponse = await pterodactylClientRequest("", apiKey) as PterodactylApiResponse;
      
      // Transform and sync with our database
      const pterodactylServers = Array.isArray(serversResponse.data) 
        ? serversResponse.data as PterodactylServer[] 
        : [serversResponse.data as PterodactylServer];
      
      log.debug(`Syncing ${pterodactylServers.length} servers for user ${req.user.id}`);
      const servers = await storage.syncPterodactylServers(req.user.id, pterodactylServers);
      
      log.info(`Successfully returned ${servers.length} servers for user ${req.user.id}`);
      return res.json(servers);
    } catch (error: any) {
      log.error(`Error fetching servers for user ${req.user.id}`, error);
      return res.status(500).send("Failed to fetch servers. Please check your Pterodactyl API key and try again.");
    }
  });
  
  // Get server details
  app.get("/api/servers/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn(`Unauthorized access attempt to /api/servers/${req.params.id}`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      log.info(`User ${req.user.id} requested server details for ${serverId}`);
      
      // First look for the server in our database
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        log.warn(`User ${req.user.id} attempted to access server ${serverId} that doesn't exist or doesn't belong to them`);
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Fetch latest server details from Pterodactyl
      log.debug(`Fetching server details for ${serverId} from Pterodactyl`);
      const serverResponse = await pterodactylClientRequest(`servers/${serverId}`, apiKey) as PterodactylApiResponse;
      
      // Transform and update our database
      const pterodactylServer = Array.isArray(serverResponse.data)
        ? serverResponse.data[0] as PterodactylServer
        : serverResponse.data as PterodactylServer;
      
      log.debug(`Syncing updated server information for ${serverId}`);
      const updatedServers = await storage.syncPterodactylServers(req.user.id, [pterodactylServer]);
      
      // Get the server with replies if there is ticket support
      const serverWithTickets = {
        ...updatedServers[0],
        tickets: [] // In a real app, fetch related tickets
      };
      
      log.info(`Successfully returned details for server ${serverId}`);
      return res.json(serverWithTickets);
    } catch (error: any) {
      log.error(`Error fetching server details for ${req.params.id}`, error);
      return res.status(500).send("Failed to fetch server details. Please check your Pterodactyl API key and try again.");
    }
  });
  
  // Get server statistics
  app.get("/api/server-stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn("Unauthorized access attempt to /api/server-stats");
      return res.status(401).send("Unauthorized");
    }
    
    try {
      log.info(`User ${req.user.id} requested server statistics`);
      
      // Get user's servers
      const servers = await storage.getServers(req.user.id);
      
      if (!servers.length) {
        log.info(`User ${req.user.id} has no servers`);
        return res.json([]);
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Prepare to store all stats
      const allStats = [];
      log.debug(`Fetching resource usage for ${servers.length} servers`);
      
      // For each server, get its resource usage
      for (const server of servers) {
        try {
          // Fetch resources from Pterodactyl
          log.debug(`Fetching resource usage for server ${server.id} (${server.pterodactylId})`);
          const resourcesResponse = await pterodactylClientRequest(`servers/${server.pterodactylId}/resources`, apiKey) as PterodactylResourceResponse;
          
          // Extract usage data
          const usageData = resourcesResponse.data?.attributes;
          
          if (usageData) {
            const usage: ServerUsage = {
              cpu: usageData.cpu_absolute || 0,
              memory: (usageData.memory_bytes / 1024 / 1024) || 0, // Convert to MB
              disk: (usageData.disk_bytes / 1024 / 1024) || 0, // Convert to MB
              state: usageData.state || 'offline',
            };
            
            // Store the stat in our database
            log.debug(`Recording resource usage for server ${server.id}: CPU ${usage.cpu}%, Memory ${usage.memory}MB, Disk ${usage.disk}MB, State ${usage.state}`);
            const stat = await storage.createServerStat(server.id, usage);
            allStats.push(stat);
          }
        } catch (serverError) {
          log.error(`Error fetching resources for server ${server.id} (${server.pterodactylId})`, serverError);
          // Continue with other servers even if one fails
        }
      }
      
      log.info(`Successfully returned stats for ${allStats.length} servers`);
      return res.json(allStats);
    } catch (error: any) {
      log.error(`Error fetching server stats for user ${req.user.id}`, error);
      return res.status(500).send("Failed to fetch server statistics. Please try again later.");
    }
  });
  
  // Control server power state
  app.post("/api/servers/:id/power", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn(`Unauthorized access attempt to /api/servers/${req.params.id}/power`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      const { action } = req.body;
      
      log.info(`User ${req.user.id} requested power ${action} for server ${serverId}`);
      
      if (!action || !["start", "stop", "restart", "kill"].includes(action)) {
        log.warn(`User ${req.user.id} provided invalid power action: ${action}`);
        return res.status(400).send("Invalid power action. Must be one of: start, stop, restart, kill");
      }
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        log.warn(`User ${req.user.id} attempted to control server ${serverId} that doesn't exist or doesn't belong to them`);
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Send power action to Pterodactyl
      log.debug(`Sending ${action} command to Pterodactyl for server ${serverId}`);
      await pterodactylClientRequest(`servers/${serverId}/power`, apiKey, "POST", { signal: action });
      
      // Update server status in our database
      let status;
      switch (action) {
        case "start":
          status = "starting";
          break;
        case "restart":
          status = "restarting";
          break;
        case "stop":
        case "kill":
          status = "stopping";
          break;
        default:
          status = server.status;
      }
      
      log.debug(`Updating server ${server.id} status to ${status}`);
      await storage.updateServerStatus(server.id, status);
      
      log.info(`Successfully initiated power ${action} for server ${serverId}`);
      return res.json({ success: true, message: `Server ${action} initiated` });
    } catch (error: any) {
      log.error(`Error controlling power for server ${req.params.id}`, error);
      return res.status(500).send("Failed to control server power. Please try again later.");
    }
  });
  
  // Send command to server console
  app.post("/api/servers/:id/command", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn(`Unauthorized access attempt to /api/servers/${req.params.id}/command`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      const { command } = req.body;
      
      if (!command) {
        log.warn(`User ${req.user.id} attempted to send empty command to server ${serverId}`);
        return res.status(400).send("Command is required");
      }
      
      log.info(`User ${req.user.id} sent command to server ${serverId}`);
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        log.warn(`User ${req.user.id} attempted to send command to server ${serverId} that doesn't exist or doesn't belong to them`);
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Send command to Pterodactyl
      log.debug(`Sending command to server ${serverId}`);
      await pterodactylClientRequest(`servers/${serverId}/command`, apiKey, "POST", { command });
      
      log.info(`Successfully sent command to server ${serverId}`);
      return res.json({ success: true, message: "Command sent" });
    } catch (error: any) {
      log.error(`Error sending command to server ${req.params.id}`, error);
      return res.status(500).send("Failed to send command. Please try again later.");
    }
  });
  
  // Get server console WebSocket token
  app.get("/api/servers/:id/websocket", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn(`Unauthorized access attempt to /api/servers/${req.params.id}/websocket`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      log.info(`User ${req.user.id} requested WebSocket token for server ${serverId}`);
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        log.warn(`User ${req.user.id} attempted to access WebSocket for server ${serverId} that doesn't exist or doesn't belong to them`);
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Get WebSocket credentials from Pterodactyl
      log.debug(`Fetching WebSocket credentials for server ${serverId} from Pterodactyl`);
      const wsResponse = await pterodactylClientRequest(`servers/${serverId}/websocket`, apiKey) as any;
      
      if (!wsResponse.data) {
        throw new Error("Invalid response from Pterodactyl API");
      }
      
      log.info(`Successfully retrieved WebSocket credentials for server ${serverId}`);
      return res.json(wsResponse.data);
    } catch (error: any) {
      log.error(`Error retrieving WebSocket credentials for server ${req.params.id}`, error);
      return res.status(500).send("Failed to retrieve console connection details. Please try again later.");
    }
  });
  
  // Get server backups
  app.get("/api/servers/:id/backups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn(`Unauthorized access attempt to /api/servers/${req.params.id}/backups`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      log.info(`User ${req.user.id} requested backups for server ${serverId}`);
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        log.warn(`User ${req.user.id} attempted to access backups for server ${serverId} that doesn't exist or doesn't belong to them`);
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Get backups from Pterodactyl
      log.debug(`Fetching backups for server ${serverId} from Pterodactyl`);
      const backupsResponse = await pterodactylClientRequest(`servers/${serverId}/backups`, apiKey) as any;
      
      if (!backupsResponse.data) {
        throw new Error("Invalid response from Pterodactyl API");
      }
      
      log.info(`Successfully retrieved ${Array.isArray(backupsResponse.data) ? backupsResponse.data.length : 0} backups for server ${serverId}`);
      return res.json(backupsResponse.data);
    } catch (error: any) {
      log.error(`Error retrieving backups for server ${req.params.id}`, error);
      return res.status(500).send("Failed to retrieve backups. Please try again later.");
    }
  });
  
  // Create server backup
  app.post("/api/servers/:id/backups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      log.warn(`Unauthorized access attempt to create backup for server ${req.params.id}`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      const { name } = req.body;
      
      log.info(`User ${req.user.id} requested new backup creation for server ${serverId}`);
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        log.warn(`User ${req.user.id} attempted to create backup for server ${serverId} that doesn't exist or doesn't belong to them`);
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        log.warn(`User ${req.user.id} has no Pterodactyl API key set`);
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Create backup in Pterodactyl
      log.debug(`Creating backup for server ${serverId} in Pterodactyl`);
      const backupResponse = await pterodactylClientRequest(
        `servers/${serverId}/backups`, 
        apiKey, 
        "POST", 
        { name: name || `Backup ${new Date().toISOString()}` }
      ) as any;
      
      log.info(`Successfully initiated backup creation for server ${serverId}`);
      return res.status(201).json(backupResponse.data);
    } catch (error: any) {
      log.error(`Error creating backup for server ${req.params.id}`, error);
      return res.status(500).send("Failed to create backup. Please try again later.");
    }
  });
}
