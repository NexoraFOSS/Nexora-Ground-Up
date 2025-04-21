import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupPterodactyl } from "./pterodactyl";
import { setupBilling } from "./billing";
import { setupTickets } from "./tickets";
import { ServerResponse } from "./types";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up Pterodactyl integration routes
  setupPterodactyl(app);
  
  // Set up billing routes
  setupBilling(app);
  
  // Set up ticket system routes
  setupTickets(app);
  
  // API settings routes
  app.get("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const settings = await storage.getUserSettings(req.user.id);
    res.json(settings);
  });
  
  // API keys routes
  app.get("/api/api-keys", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const apiKeys = await storage.getApiKeys(req.user.id);
    res.json(apiKeys);
  });
  
  app.post("/api/api-keys", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const { name } = req.body;
    if (!name) {
      return res.status(400).send("Name is required");
    }
    
    const apiKey = await storage.createApiKey(req.user.id, name);
    res.status(201).json(apiKey);
  });
  
  app.delete("/api/api-keys/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const keyId = parseInt(req.params.id);
    if (isNaN(keyId)) {
      return res.status(400).send("Invalid key ID");
    }
    
    // Check if the key belongs to the user
    const key = await storage.getApiKey(keyId);
    if (!key || key.userId !== req.user.id) {
      return res.status(404).send("API key not found");
    }
    
    await storage.deleteApiKey(keyId);
    res.status(204).send();
  });
  
  // Login history routes
  app.get("/api/login-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const history = await storage.getLoginHistory(req.user.id);
    res.json(history);
  });
  
  // Change password route
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).send("Current password and new password are required");
    }
    
    const success = await storage.changePassword(req.user.id, currentPassword, newPassword);
    
    if (!success) {
      return res.status(400).send("Current password is incorrect");
    }
    
    res.status(200).json({ message: "Password updated successfully" });
  });
  
  // Update Pterodactyl API key
  app.patch("/api/user/pterodactyl-key", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    const { pterodactylApiKey } = req.body;
    
    if (!pterodactylApiKey) {
      return res.status(400).send("Pterodactyl API key is required");
    }
    
    const user = await storage.updatePterodactylApiKey(req.user.id, pterodactylApiKey);
    
    res.status(200).json(user);
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
