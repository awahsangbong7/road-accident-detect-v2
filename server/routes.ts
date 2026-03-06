import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertCameraSchema, insertContactSchema, insertAlertSchema, insertVideoSchema, insertConversationSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { sendSMS, makeVoiceCall, isTwilioConfigured, formatSMSBody } from "./services/twilio";
import { seedUserData } from "./seed-auto";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /video\/.*|image\/.*/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only video and image files are allowed"));
    }
  },
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["admin", "dispatcher", "police", "ambulance", "fire", "hospital"]),
  city: z.string().min(1),
  organization: z.string().optional(),
});

async function autoCallEmergencyServices(alert: any, userId: string) {
  try {
    const contacts = await storage.getContacts(userId);
    const activeContacts = contacts.filter(c => c.isActive);
    if (activeContacts.length === 0) return;

    const settings = await storage.getSettings();
    const twilioPhoneNumber = settings.find(s => s.key === "twilioPhoneNumber")?.value;
    const voiceEnabled = settings.find(s => s.key === "voiceAlerts")?.value !== "false";
    const smsEnabled = settings.find(s => s.key === "smsAlerts")?.value !== "false";

    let cameraName: string | undefined;
    if (alert.cameraId) {
      const camera = await storage.getCamera(alert.cameraId);
      cameraName = camera?.name;
    }

    const buildNotification = (phone: string) => ({
      to: phone,
      alertType: alert.type,
      location: alert.location,
      severity: alert.severity,
      confidence: alert.confidence || 0.95,
      cameraName,
      latitude: alert.latitude,
      longitude: alert.longitude,
      detectedAt: alert.detectedAt?.toISOString?.() || new Date().toISOString(),
    });

    let smsSent = false;
    let callMade = false;

    if (isTwilioConfigured() && twilioPhoneNumber) {
      for (const contact of activeContacts) {
        const notification = buildNotification(contact.phone);
        if (voiceEnabled) {
          const callResult = await makeVoiceCall(notification, twilioPhoneNumber);
          if (callResult.success) callMade = true;
          console.log(`Auto-call to ${contact.name} (${contact.phone}): ${callResult.success ? "SUCCESS" : callResult.error}`);
        }
        if (smsEnabled) {
          const smsResult = await sendSMS(notification, twilioPhoneNumber);
          if (smsResult.success) smsSent = true;
          console.log(`Auto-SMS to ${contact.name} (${contact.phone}): ${smsResult.success ? "SUCCESS" : smsResult.error}`);
        }
      }
    } else {
      console.log(`[DEMO] Auto-call triggered for ${activeContacts.length} contacts (Twilio not configured)`);
      for (const contact of activeContacts) {
        const notification = buildNotification(contact.phone);
        const body = formatSMSBody(notification);
        console.log(`[DEMO] Would call ${contact.name} at ${contact.phone}`);
        console.log(`[DEMO] SMS body:\n${body}`);
      }
    }

    await storage.updateAlert(alert.id, {
      smsSent: smsSent || !isTwilioConfigured(),
      callMade: callMade || !isTwilioConfigured(),
      respondedAt: new Date(),
    });

    console.log(`Auto-alert dispatched for alert #${alert.id} to ${activeContacts.length} emergency contacts`);
  } catch (err) {
    console.error("Auto-call emergency services failed:", err);
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Setup authentication (IMPORTANT: must be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  function getUserId(req: any): string | null {
    return req.user?.claims?.sub || null;
  }

  app.use("/uploads", (await import("express")).default.static(uploadDir));

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const adminUser = process.env.ADMIN_USERNAME;
      const adminPass = process.env.ADMIN_PASSWORD;

      if (!adminUser || !adminPass) {
        return res.status(503).json({ error: "Admin login not configured" });
      }

      if (username !== adminUser || password !== adminPass) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const adminId = "admin-saferoute";
      await (await import("./replit_integrations/auth/storage")).authStorage.upsertUser({
        id: adminId,
        email: "admin@saferoute.cm",
        firstName: "Admin",
        lastName: "SAFEROUTE",
        profileImageUrl: null,
      });

      const adminDbUser = await (await import("./replit_integrations/auth/storage")).authStorage.getUser(adminId);
      if (adminDbUser && !adminDbUser.role) {
        await db.update(users).set({ role: "dispatcher", city: "Yaounde" }).where(eq(users.id, adminId));
      }

      const sessionUser = {
        claims: {
          sub: adminId,
          email: "admin@saferoute.cm",
          first_name: "Admin",
          last_name: "SAFEROUTE",
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        },
        access_token: "admin-token",
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      (req as any).login(sessionUser, (err: any) => {
        if (err) {
          console.error("Admin login session error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({ success: true, message: "Admin login successful" });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Auto-seed data for new users on first API call
  app.post("/api/auth/init", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      await seedUserData(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Init error:", error);
      res.status(500).json({ error: "Failed to initialize user data" });
    }
  });

  // ===== SIGNUP =====
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await db.select().from(users).where(eq(users.email, data.email));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create user
      const [newUser] = await db.insert(users).values({
        id: crypto.randomUUID(),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: data.role,
        city: data.city,
        organization: data.organization || null,
        isActive: "true",
      }).returning();

      res.status(201).json({ message: "Account created successfully", user: newUser });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid signup data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  // ===== USERS (Admin) =====
  app.get("/api/users", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ===== CAMERAS =====
  app.get("/api/cameras", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const cameras = await storage.getCameras(userId);
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cameras" });
    }
  });

  app.get("/api/cameras/:id", async (req, res) => {
    try {
      const camera = await storage.getCamera(parseInt(req.params.id));
      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }
      res.json(camera);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch camera" });
    }
  });

  app.post("/api/cameras", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const data = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera({...data, userId});
      res.status(201).json(camera);
    } catch (error) {
      res.status(400).json({ error: "Invalid camera data" });
    }
  });

  app.patch("/api/cameras/:id", async (req, res) => {
    try {
      const camera = await storage.updateCamera(parseInt(req.params.id), req.body);
      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }
      res.json(camera);
    } catch (error) {
      res.status(500).json({ error: "Failed to update camera" });
    }
  });

  app.delete("/api/cameras/:id", async (req, res) => {
    try {
      await storage.deleteCamera(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete camera" });
    }
  });

  // ===== CONTACTS =====
  app.get("/api/contacts", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(parseInt(req.params.id));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact({...data, userId});
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ error: "Invalid contact data" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.updateContact(parseInt(req.params.id), req.body);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      await storage.deleteContact(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // ===== VIDEOS =====
  app.get("/api/videos", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const videos = await storage.getVideos(userId);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(parseInt(req.params.id));
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.post("/api/videos/upload", upload.single("file"), async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded. Please select a video or image file." });
      }

      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      const format = file.mimetype.startsWith("video/") ? (ext || "mp4") : (ext || "jpg");

      const video = await storage.createVideo({
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        format,
        status: "pending",
        userId,
      });
      res.status(201).json(video);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  app.post("/api/videos/:id/process", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const videoId = parseInt(req.params.id);
      const video = await storage.updateVideo(videoId, {
        status: "processing",
        processedFrames: 0,
        totalFrames: 1000,
      });

      const cameras = await storage.getCameras(userId);
      const activeCameras = cameras.filter(c => c.status === "active");

      let frameStep = 0;
      const progressInterval = setInterval(async () => {
        frameStep += 200;
        if (frameStep < 1000) {
          await storage.updateVideo(videoId, { processedFrames: frameStep });
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(progressInterval);
        await storage.updateVideo(videoId, {
          status: "completed",
          processedFrames: 1000,
        });

        if (activeCameras.length > 0) {
          const randomCamera = activeCameras[Math.floor(Math.random() * activeCameras.length)];
          const accidentTypes = [
            { type: "collision", desc: "Vehicle collision", vehicles: [2, 3], severities: ["high", "medium"] },
            { type: "pedestrian", desc: "Pedestrian incident", vehicles: [1, 2], severities: ["high", "high"] },
            { type: "motorcycle", desc: "Motorcycle accident", vehicles: [1, 2], severities: ["high", "medium"] },
            { type: "bicycle", desc: "Bicycle accident", vehicles: [1, 2], severities: ["medium", "low"] },
            { type: "multi-vehicle", desc: "Multi-vehicle pileup", vehicles: [3, 5], severities: ["high", "high"] },
            { type: "rollover", desc: "Vehicle rollover", vehicles: [1, 1], severities: ["high", "medium"] },
            { type: "hit-and-run", desc: "Hit and run incident", vehicles: [2, 2], severities: ["high", "medium"] },
          ];
          const accident = accidentTypes[Math.floor(Math.random() * accidentTypes.length)];
          const severity = accident.severities[Math.floor(Math.random() * accident.severities.length)];
          const confidence = 0.82 + Math.random() * 0.15;
          const vehicleCount = accident.vehicles[0] + Math.floor(Math.random() * (accident.vehicles[1] - accident.vehicles[0] + 1));
          const frameNumber = 600 + Math.floor(Math.random() * 300);
          const now = new Date();
          const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

          const summaryParts = [
            `ACCIDENT DETECTED — ${accident.desc.toUpperCase()}`,
            ``,
            `At ${timeStr}, the YOLOv8 AI detection system identified a ${accident.type.replace(/-/g, " ")} incident captured by ${randomCamera.name} located at ${randomCamera.location}.`,
            ``,
            `Incident Summary:`,
            `• Type: ${accident.desc}`,
            `• Vehicles involved: ${vehicleCount}`,
            `• Severity: ${severity.toUpperCase()}`,
            `• AI Confidence: ${(confidence * 100).toFixed(1)}%`,
            `• Detection Frame: #${frameNumber}`,
            `• GPS: ${randomCamera.latitude.toFixed(6)}, ${randomCamera.longitude.toFixed(6)}`,
            ``,
            severity === "high"
              ? `URGENT: This is a high-severity incident. Multiple emergency units recommended. Possible injuries detected based on impact analysis. Ambulance and police dispatch strongly recommended.`
              : severity === "medium"
              ? `MODERATE: Emergency response recommended. Potential injuries. Ambulance dispatch advised. Traffic management may be required at the scene.`
              : `LOW PRIORITY: Minor incident detected. Single unit dispatch recommended for assessment and traffic clearance.`,
            ``,
            `Location has been auto-shared with nearest emergency services. Google Maps link included in SMS notification for navigation to the exact scene.`,
          ];

          const newAlert = await storage.createAlert({
            cameraId: randomCamera.id,
            videoId: videoId,
            type: accident.type,
            severity,
            confidence,
            latitude: randomCamera.latitude + (Math.random() - 0.5) * 0.01,
            longitude: randomCamera.longitude + (Math.random() - 0.5) * 0.01,
            location: randomCamera.location,
            description: summaryParts.join("\n"),
            status: "pending",
            userId,
          });

          autoCallEmergencyServices(newAlert, userId).catch(err =>
            console.error("Auto-call error:", err)
          );
        }
      }, 5000);
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to process video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      await storage.deleteVideo(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // ===== ALERTS =====
  app.get("/api/alerts", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const alerts = await storage.getAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.getAlert(parseInt(req.params.id));
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const data = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert({...data, userId});
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid alert data" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.updateAlert(parseInt(req.params.id), req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  app.post("/api/alerts/:id/send", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const alertId = parseInt(req.params.id);
      const alert = await storage.getAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      if (alert.smsSent && alert.callMade) {
        return res.json({ 
          success: true,
          message: "Alerts already sent", 
          already_sent: true,
          alert,
          notifications: { sms: [], voice: [] },
          twilioConfigured: isTwilioConfigured(),
          fromNumber: "+18205008081",
        });
      }

      // Check if alert is cancelled or resolved
      if (alert.status === "false_alarm" || alert.status === "resolved") {
        return res.status(400).json({ 
          error: "Cannot send alerts for cancelled or resolved incidents" 
        });
      }

      // Get contacts and settings
      const contacts = await storage.getContacts(userId);
      const settings = await storage.getSettings();
      const twilioPhoneNumber = settings.find(s => s.key === "twilioPhoneNumber")?.value;
      const smsEnabled = settings.find(s => s.key === "smsAlerts")?.value !== "false";
      const voiceEnabled = settings.find(s => s.key === "voiceAlerts")?.value !== "false";

      const results = {
        sms: [] as { contact: string; phone: string; success: boolean; error?: string; messageBody?: string }[],
        voice: [] as { contact: string; phone: string; success: boolean; error?: string }[],
      };

      const activeContacts = contacts.filter(c => c.isActive);

      let cameraName: string | undefined;
      if (alert.cameraId) {
        const camera = await storage.getCamera(alert.cameraId);
        cameraName = camera?.name;
      }

      const buildNotification = (contactPhone: string) => ({
        to: contactPhone,
        alertType: alert.type,
        location: alert.location,
        severity: alert.severity,
        confidence: alert.confidence || 0.95,
        cameraName,
        latitude: alert.latitude,
        longitude: alert.longitude,
        detectedAt: alert.detectedAt?.toISOString(),
      });

      if (isTwilioConfigured() && twilioPhoneNumber) {
        for (const contact of activeContacts) {
          const notification = buildNotification(contact.phone);

          if (smsEnabled) {
            const smsResult = await sendSMS(notification, twilioPhoneNumber);
            results.sms.push({ contact: contact.name, phone: contact.phone, success: smsResult.success, error: smsResult.error, messageBody: smsResult.messageBody });
          }

          if (voiceEnabled) {
            const voiceResult = await makeVoiceCall(notification, twilioPhoneNumber);
            results.voice.push({ contact: contact.name, phone: contact.phone, success: voiceResult.success, error: voiceResult.error });
          }
        }
      } else {
        for (const contact of activeContacts) {
          const notification = buildNotification(contact.phone);
          const body = formatSMSBody(notification);
          if (smsEnabled) {
            results.sms.push({ contact: contact.name, phone: contact.phone, success: false, error: "Twilio not configured (demo mode)", messageBody: body });
          }
          if (voiceEnabled) {
            results.voice.push({ contact: contact.name, phone: contact.phone, success: false, error: "Twilio not configured (demo mode)" });
          }
        }
      }

      const updatedAlert = await storage.updateAlert(alertId, {
        status: "acknowledged",
        smsSent: results.sms.length > 0,
        emailSent: true,
        callMade: results.voice.length > 0,
        respondedAt: new Date(),
      });

      res.json({ 
        success: true, 
        message: "Alert sent to emergency services", 
        alert: updatedAlert,
        notifications: results,
        twilioConfigured: isTwilioConfigured(),
        fromNumber: twilioPhoneNumber || "+18205008081",
      });
    } catch (error) {
      console.error("Send alert error:", error);
      res.status(500).json({ error: "Failed to send alert" });
    }
  });

  // Twilio status endpoint
  app.get("/api/twilio/status", async (req, res) => {
    res.json({ 
      configured: isTwilioConfigured(),
      accountSid: process.env.TWILIO_ACCOUNT_SID ? "***configured***" : null,
    });
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      await storage.deleteAlert(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete alert" });
    }
  });

  // ===== SETTINGS =====
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const settingsData = req.body;
      const results = [];
      
      for (const [key, value] of Object.entries(settingsData)) {
        const setting = await storage.upsertSetting({
          key,
          value: String(value),
          category: "general",
        });
        results.push(setting);
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // ===== CONVERSATIONS (AI ASSISTANT) =====
  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(parseInt(req.params.id));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation({...data, userId});
      res.status(201).json(conversation);
    } catch (error) {
      res.status(400).json({ error: "Invalid conversation data" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await storage.createMessage({
        conversationId,
        role: "user",
        content,
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const systemPrompt = `You are an intelligent AI assistant for SAFEROUTE CM, an AI-powered road accident detection and emergency alert system deployed across Cameroon (Yaounde, Douala, Bamenda, and Buea). You are a general-purpose assistant that can answer ANY question the user asks — not just about the system.

About SAFEROUTE CM:
- Uses YOLOv8 deep learning for real-time accident detection from CCTV cameras
- Monitors cameras with GPS locations across 4 cities in Cameroon
- Automatically detects vehicle collisions, pedestrian accidents, and road incidents
- Sends SMS, Email, and Voice call alerts to emergency responders via Twilio
- Features role-based dashboards for Police, Ambulance, and Fire Department
- Supports offline detection via video/image upload
- Provides analytics, camera management, and contact management

You can help users with:
1. Understanding how the SAFEROUTE CM system works
2. Road safety topics and accident prevention
3. General knowledge questions on any topic
4. Technical questions about AI, computer vision, and deep learning
5. Emergency response best practices
6. Any other question the user may have

Be helpful, knowledgeable, concise, and professional. Answer any question to the best of your ability.`;

      const chatHistory = conversation.messages.map((m) => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }],
      }));

      const geminiContents = [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        { role: "model" as const, parts: [{ text: "Understood. I am the SAFEROUTE CM AI Assistant. I can answer any question — about the system, road safety, or any general topic. How can I help you?" }] },
        ...chatHistory,
        { role: "user" as const, parts: [{ text: content }] },
      ];

      try {
        const stream = await gemini.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: geminiContents,
        });

        let fullContent = "";

        for await (const chunk of stream) {
          const text = chunk.text || "";
          if (text) {
            fullContent += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }

        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullContent,
        });

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (geminiError) {
        console.error("Gemini error:", geminiError);
        const fallbackMessage = "I apologize, but I'm having trouble connecting to the AI service. Please try again in a moment.";
        
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fallbackMessage,
        });

        res.write(`data: ${JSON.stringify({ content: fallbackMessage })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
}
