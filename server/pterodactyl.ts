import { Express, Request, Response } from "express";
import fetch from "node-fetch";
import { storage } from "./storage";
import { PterodactylServer, PterodactylApiResponse, ServerUsage, PterodactylResourceResponse } from "./types";
import config from "../config";
import type { Config } from "../shared/config-types";

// Helper function to make API requests to Pterodactyl
async function pterodactylRequest(
  endpoint: string,
  apiKey: string,
  method: string = "GET",
  body?: any
) {
  try {
    const response = await fetch(`${config.pterodactyl.baseUrl}/api/application/${endpoint}`, {
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
      throw new Error(`Pterodactyl API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Pterodactyl API request failed:", error);
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
    const response = await fetch(`${config.pterodactyl.baseUrl}/api/client/${endpoint}`, {
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
      throw new Error(`Pterodactyl API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Pterodactyl Client API request failed:", error);
    throw error;
  }
}

export function setupPterodactyl(app: Express) {
  // List servers for authenticated user
  app.get("/api/servers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Fetch servers from Pterodactyl
      const serversResponse = await pterodactylClientRequest("", apiKey) as PterodactylApiResponse;
      
      // Transform and sync with our database
      const pterodactylServers = Array.isArray(serversResponse.data) 
        ? serversResponse.data as PterodactylServer[] 
        : [serversResponse.data as PterodactylServer];
      const servers = await storage.syncPterodactylServers(req.user.id, pterodactylServers);
      
      return res.json(servers);
    } catch (error: any) {
      console.error("Error fetching servers:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Get server details
  app.get("/api/servers/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      
      // First look for the server in our database
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Fetch latest server details from Pterodactyl
      const serverResponse = await pterodactylClientRequest(`servers/${serverId}`, apiKey) as PterodactylApiResponse;
      
      // Transform and update our database
      const pterodactylServer = Array.isArray(serverResponse.data)
        ? serverResponse.data[0] as PterodactylServer
        : serverResponse.data as PterodactylServer;
      const updatedServers = await storage.syncPterodactylServers(req.user.id, [pterodactylServer]);
      
      // Get the server with replies if there is ticket support
      const serverWithTickets = {
        ...updatedServers[0],
        tickets: [] // In a real app, fetch related tickets
      };
      
      return res.json(serverWithTickets);
    } catch (error: any) {
      console.error("Error fetching server details:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Get server statistics
  app.get("/api/server-stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      // Get user's servers
      const servers = await storage.getServers(req.user.id);
      
      if (!servers.length) {
        return res.json([]);
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Prepare to store all stats
      const allStats = [];
      
      // For each server, get its resource usage
      for (const server of servers) {
        try {
          // Fetch resources from Pterodactyl
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
            const stat = await storage.createServerStat(server.id, usage);
            allStats.push(stat);
          }
        } catch (serverError) {
          console.error(`Error fetching resources for server ${server.id}:`, serverError);
          // Continue with other servers even if one fails
        }
      }
      
      return res.json(allStats);
    } catch (error: any) {
      console.error("Error fetching server stats:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Control server power state
  app.post("/api/servers/:id/power", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      const { action } = req.body;
      
      if (!action || !["start", "stop", "restart", "kill"].includes(action)) {
        return res.status(400).send("Invalid power action. Must be one of: start, stop, restart, kill");
      }
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Send power action to Pterodactyl
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
      
      await storage.updateServerStatus(server.id, status);
      
      return res.json({ success: true, message: `Server ${action} initiated` });
    } catch (error: any) {
      console.error("Error controlling server power:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Send command to server console
  app.post("/api/servers/:id/command", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const serverId = req.params.id;
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).send("Command is required");
      }
      
      // Check if server exists and belongs to the user
      const server = await storage.getServerByPterodactylId(serverId);
      
      if (!server || server.userId !== req.user.id) {
        return res.status(404).send("Server not found");
      }
      
      // Get user's pterodactyl API key
      const apiKey = req.user.pterodactylApiKey;
      
      if (!apiKey) {
        return res.status(400).send("Pterodactyl API key not set. Please set it in your profile settings.");
      }
      
      // Send command to Pterodactyl
      await pterodactylClientRequest(`servers/${serverId}/command`, apiKey, "POST", { command });
      
      return res.json({ success: true, message: "Command sent" });
    } catch (error: any) {
      console.error("Error sending command:", error);
      return res.status(500).send(error.message);
    }
  });
}
