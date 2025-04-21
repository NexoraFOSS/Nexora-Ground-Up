import { Express, Request, Response } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import config from "../config";
import type { Config } from "../shared/config-types";

// In a real implementation, this would use Stripe's SDK
// const stripe = new Stripe(config.stripe.secretKey!, { apiVersion: "2023-10-16" });

export function setupBilling(app: Express) {
  // Get user's current subscription
  app.get("/api/subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      // Get the user's subscription
      const subscription = await storage.getUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.status(404).send("No active subscription found");
      }
      
      // Get the associated subscription plan
      const plan = await storage.getSubscriptionPlanById(subscription.planId);
      
      if (!plan) {
        return res.status(404).send("Subscription plan not found");
      }
      
      // Combine information for client
      const subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        memoryLimit: plan.memoryLimit,
        diskLimit: plan.diskLimit,
        cpuLimit: plan.cpuLimit,
        serverLimit: plan.serverLimit,
        backupLimit: plan.backupLimit
      };
      
      return res.json(subscriptionData);
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Get available subscription plans
  app.get("/api/subscription-plans", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const plans = await storage.getSubscriptionPlans();
      return res.json(plans);
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Get user's invoices
  app.get("/api/invoices", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const invoices = await storage.getInvoices(req.user.id);
      
      // If no invoices exist yet, return a sample invoice for demo purposes
      if (invoices.length === 0) {
        const now = new Date();
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        // Create sample invoices
        const sampleInvoices = [
          {
            id: 1001,
            userId: req.user.id,
            stripeInvoiceId: `inv_${crypto.randomBytes(8).toString('hex')}`,
            amount: 24.99,
            currency: "usd",
            status: "paid",
            paidAt: now,
            createdAt: now,
            dueDate: now,
            description: "Nexora Premium Plan - Monthly Subscription"
          },
          {
            id: 1002,
            userId: req.user.id,
            stripeInvoiceId: `inv_${crypto.randomBytes(8).toString('hex')}`,
            amount: 24.99,
            currency: "usd",
            status: "paid",
            paidAt: lastMonth,
            createdAt: lastMonth,
            dueDate: lastMonth,
            description: "Nexora Premium Plan - Monthly Subscription"
          }
        ];
        
        return res.json(sampleInvoices);
      }
      
      return res.json(invoices);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Change subscription plan
  app.post("/api/change-plan", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).send("Plan ID is required");
      }
      
      // Check if the plan exists
      const plan = await storage.getSubscriptionPlanById(parseInt(planId));
      
      if (!plan) {
        return res.status(404).send("Subscription plan not found");
      }
      
      // In a real implementation, this would create a Stripe checkout session
      // or update the subscription in Stripe
      
      // For now, just get the current subscription and update it
      const userSubscription = await storage.getUserSubscription(req.user.id);
      
      if (!userSubscription) {
        return res.status(404).send("No active subscription found");
      }
      
      // Update the subscription
      userSubscription.planId = plan.id;
      
      // In a real implementation, this would save to database
      // await storage.updateUserSubscription(userSubscription);
      
      return res.json({ 
        success: true, 
        message: "Subscription plan changed successfully",
        plan: plan.name
      });
    } catch (error: any) {
      console.error("Error changing subscription plan:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Cancel subscription
  app.post("/api/cancel-subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      // Get the user's subscription
      const subscription = await storage.getUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.status(404).send("No active subscription found");
      }
      
      // Mark the subscription to cancel at the end of the billing period
      subscription.cancelAtPeriodEnd = true;
      
      // In a real implementation, this would cancel the subscription in Stripe
      // and update the database
      // await storage.updateUserSubscription(subscription);
      
      return res.json({ 
        success: true, 
        message: "Subscription will be canceled at the end of the billing period" 
      });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Create a payment intent for one-time purchases
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const { amount, description } = req.body;
      
      if (!amount) {
        return res.status(400).send("Amount is required");
      }
      
      // In a real implementation, this would create a Stripe payment intent
      /*
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        customer: req.user.stripeCustomerId,
        description: description || "One-time purchase"
      });
      
      return res.json({ clientSecret: paymentIntent.client_secret });
      */
      
      // For now, just return a mock client secret
      return res.json({ 
        clientSecret: `pi_${crypto.randomBytes(24).toString('hex')}_secret_${crypto.randomBytes(24).toString('hex')}` 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Create or get subscription
  app.post("/api/get-or-create-subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      // Get the user's current subscription
      const subscription = await storage.getUserSubscription(req.user.id);
      
      if (subscription && subscription.status === "active") {
        // User already has an active subscription
        // In a real implementation, this would return the Stripe subscription
        return res.json({
          subscriptionId: `sub_${crypto.randomBytes(16).toString('hex')}`,
          clientSecret: `seti_${crypto.randomBytes(24).toString('hex')}_secret_${crypto.randomBytes(24).toString('hex')}`
        });
      }
      
      // Create a new subscription
      // In a real implementation, this would create a Stripe customer if needed,
      // then create a Stripe subscription
      
      return res.json({
        subscriptionId: `sub_${crypto.randomBytes(16).toString('hex')}`,
        clientSecret: `seti_${crypto.randomBytes(24).toString('hex')}_secret_${crypto.randomBytes(24).toString('hex')}`
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(500).send(error.message);
    }
  });
}
