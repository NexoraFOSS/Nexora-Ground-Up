import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupPterodactyl } from "./pterodactyl";
import { setupBilling } from "./billing";
import { setupTickets } from "./tickets";
import { setupLogging } from "./logs";
import { ServerResponse } from "./types";
import { storage } from "./storage";
import logger from "./utils/logger";

// Create a module-specific logger
const log = logger.createLogger("routes");

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    log.info("Registering API routes");

    // Set up authentication routes
    setupAuth(app);
    log.info("Authentication routes registered");

    // Set up Pterodactyl integration routes
    setupPterodactyl(app);
    log.info("Pterodactyl routes registered");

    // Set up billing routes
    setupBilling(app);
    log.info("Billing routes registered");

    // Set up ticket system routes
    setupTickets(app);
    log.info("Ticket routes registered");

    // API settings routes
    app.get("/api/settings", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }

      try {
        const settings = await storage.getUserSettings(req.user.id);
        res.json(settings);
      } catch (error) {
        log.error("Failed to fetch user settings", error);
        res.status(500).send("Failed to fetch settings");
      }
    });

    // API keys routes
    app.get("/api/api-keys", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }

      try {
        const apiKeys = await storage.getApiKeys(req.user.id);
        res.json(apiKeys);
      } catch (error) {
        log.error("Failed to fetch API keys", error);
        res.status(500).send("Failed to fetch API keys");
      }
    });

    app.post("/api/api-keys", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }

      const { name } = req.body;
      if (!name) {
        return res.status(400).send("Name is required");
      }

      try {
        const apiKey = await storage.createApiKey(req.user.id, name);
        log.info(`API key created for user ${req.user.id}`);
        res.status(201).json(apiKey);
      } catch (error) {
        log.error("Failed to create API key", error);
        res.status(500).send("Failed to create API key");
      }
    });

    app.delete("/api/api-keys/:id", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }

      const keyId = parseInt(req.params.id);
      if (isNaN(keyId)) {
        return res.status(400).send("Invalid key ID");
      }

      try {
        // Check if the key belongs to the user
        const key = await storage.getApiKey(keyId);
        if (!key || key.userId !== req.user.id) {
          return res.status(404).send("API key not found");
        }

        await storage.deleteApiKey(keyId);
        log.info(`API key ${keyId} deleted by user ${req.user.id}`);
        res.status(204).send();
      } catch (error) {
        log.error(`Failed to delete API key ${keyId}`, error);
        res.status(500).send("Failed to delete API key");
      }
    });

    // Login history routes
    app.get("/api/login-history", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }

      try {
        const history = await storage.getLoginHistory(req.user.id);
        res.json(history);
      } catch (error) {
        log.error("Failed to fetch login history", error);
        res.status(500).send("Failed to fetch login history");
      }
    });

    // Change password route
    app.post("/api/change-password", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .send("Current password and new password are required");
      }

      try {
        const success = await storage.changePassword(
          req.user.id,
          currentPassword,
          newPassword,
        );

        if (!success) {
          log.warn(
            `Failed password change attempt for user ${req.user.id} - incorrect current password`,
          );
          return res.status(400).send("Current password is incorrect");
        }

        log.info(`Password changed for user ${req.user.id}`);
        res.status(200).json({ message: "Password updated successfully" });
      } catch (error) {
        log.error("Failed to change password", error);
        res.status(500).send("Failed to change password");
      }
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

      try {
        const user = await storage.updatePterodactylApiKey(
          req.user.id,
          pterodactylApiKey,
        );
        log.info(`Pterodactyl API key updated for user ${req.user.id}`);
        res.status(200).json(user);
      } catch (error) {
        log.error("Failed to update Pterodactyl API key", error);
        res.status(500).send("Failed to update Pterodactyl API key");
      }
    });

    // Set up logging endpoints and error handlers
    setupLogging(app);
    log.info("Logging routes registered");

    const httpServer = createServer(app);
    log.info("HTTP server created successfully");

    return httpServer;
  } catch (error) {
    log.error("Failed to register routes", error);
    throw error;
  }
}
