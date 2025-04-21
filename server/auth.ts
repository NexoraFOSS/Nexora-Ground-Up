import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import crypto from "crypto";
import config from "../config.js";
import type { Config } from "../shared/config-types";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: config.session.maxAge,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if input is an email
        const isEmail = username.includes('@');
        
        let user;
        if (isEmail) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !(await storage.comparePasswords(password, user.password))) {
          // Record failed login attempt
          if (user) {
            await storage.recordLogin(
              user.id, 
              "127.0.0.1", // In a real app, get the actual IP
              "API Login", // In a real app, get the actual user agent
              false
            );
          }
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Record successful login
        await storage.recordLogin(
          user.id, 
          "127.0.0.1", // In a real app, get the actual IP
          "API Login", // In a real app, get the actual user agent
          true
        );
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, fullName } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).send("Username, email, and password are required");
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).send("Username already exists");
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }
      
      const hashedPassword = await storage.hashPassword(password);
      
      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        verificationToken,
      });

      // In a real app, send verification email here
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).send(info?.message || "Invalid username or password");
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  app.patch("/api/user", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const { username, email, fullName } = req.body;
      
      // Validate inputs
      if (!username || !email) {
        return res.status(400).send("Username and email are required");
      }
      
      // Check if username is being changed and already exists
      if (username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).send("Username already exists");
        }
      }
      
      // Check if email is being changed and already exists
      if (email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).send("Email already exists");
        }
      }
      
      const updatedUser = await storage.updateUser(req.user.id, {
        username,
        email,
        fullName
      });
      
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });
}
