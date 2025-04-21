import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { InsertTicket, InsertTicketReply } from "@shared/schema";

export function setupTickets(app: Express) {
  // Get all tickets for authenticated user
  app.get("/api/tickets", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const tickets = await storage.getTickets(req.user.id);
      return res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Get a specific ticket with replies
  app.get("/api/tickets/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        return res.status(400).send("Invalid ticket ID");
      }
      
      // Get the ticket with replies
      const ticketData = await storage.getTicketWithReplies(ticketId);
      
      if (!ticketData || ticketData.ticket.userId !== req.user.id) {
        return res.status(404).send("Ticket not found");
      }
      
      // Restructure for client
      const responseData = {
        ...ticketData.ticket,
        replies: ticketData.replies
      };
      
      return res.json(responseData);
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Create a new ticket
  app.post("/api/tickets", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const { title, category, priority, message } = req.body;
      
      if (!title || !category || !message) {
        return res.status(400).send("Title, category, and message are required");
      }
      
      // Create the ticket
      const ticketData: InsertTicket = {
        userId: req.user.id,
        title,
        category,
        priority: priority || "medium",
        status: "open"
      };
      
      const ticket = await storage.createTicket(ticketData);
      
      // Add the initial message as a reply
      const replyData: InsertTicketReply = {
        ticketId: ticket.id,
        userId: req.user.id,
        message,
        isStaff: false
      };
      
      await storage.addTicketReply(replyData);
      
      // Add a staff reply for demo purposes
      const staffReplyData: InsertTicketReply = {
        ticketId: ticket.id,
        userId: 0, // Staff user ID
        message: "Thank you for contacting support. We've received your ticket and will respond shortly.",
        isStaff: true
      };
      
      await storage.addTicketReply(staffReplyData);
      
      return res.status(201).json(ticket);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Update a ticket
  app.patch("/api/tickets/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const ticketId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(ticketId)) {
        return res.status(400).send("Invalid ticket ID");
      }
      
      if (!status) {
        return res.status(400).send("Status is required");
      }
      
      // Check if ticket exists and belongs to user
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket || ticket.userId !== req.user.id) {
        return res.status(404).send("Ticket not found");
      }
      
      // Update ticket status
      const updatedTicket = await storage.updateTicketStatus(ticketId, status);
      
      // If closing the ticket, add a system message
      if (status === "closed") {
        const replyData: InsertTicketReply = {
          ticketId,
          userId: req.user.id,
          message: "This ticket has been closed by the user.",
          isStaff: false
        };
        
        await storage.addTicketReply(replyData);
      }
      
      return res.json(updatedTicket);
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      return res.status(500).send(error.message);
    }
  });
  
  // Add a reply to a ticket
  app.post("/api/tickets/:id/replies", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const ticketId = parseInt(req.params.id);
      const { message } = req.body;
      
      if (isNaN(ticketId)) {
        return res.status(400).send("Invalid ticket ID");
      }
      
      if (!message) {
        return res.status(400).send("Message is required");
      }
      
      // Check if ticket exists and belongs to user
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket || ticket.userId !== req.user.id) {
        return res.status(404).send("Ticket not found");
      }
      
      // Add the user's reply
      const replyData: InsertTicketReply = {
        ticketId,
        userId: req.user.id,
        message,
        isStaff: false
      };
      
      const reply = await storage.addTicketReply(replyData);
      
      // If ticket was closed, reopen it
      if (ticket.status === "closed") {
        await storage.updateTicketStatus(ticketId, "open");
      }
      
      // Add a staff reply for demo purposes
      const staffMessages = [
        "Thank you for the additional information. We're looking into this issue and will get back to you soon.",
        "We're investigating this matter. Could you please provide more details about when this started happening?",
        "I've checked our systems and everything seems to be working correctly. Could you try clearing your browser cache and cookies?",
        "I've escalated this to our technical team. They'll be in touch shortly.",
        "We've identified the issue and are working on a fix. Thank you for your patience."
      ];
      
      const randomMessage = staffMessages[Math.floor(Math.random() * staffMessages.length)];
      
      const staffReplyData: InsertTicketReply = {
        ticketId,
        userId: 0, // Staff user ID
        message: randomMessage,
        isStaff: true
      };
      
      // Add staff reply after a short delay
      setTimeout(async () => {
        await storage.addTicketReply(staffReplyData);
      }, 5000);
      
      return res.status(201).json(reply);
    } catch (error: any) {
      console.error("Error adding reply:", error);
      return res.status(500).send(error.message);
    }
  });
}
