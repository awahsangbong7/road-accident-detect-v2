# APPENDICES

---

## APPENDIX A: DATABASE SCHEMA

### A.1 Complete Drizzle ORM Schema Definition

The following presents the complete database schema definition for SAFEROUTE CM using Drizzle ORM with PostgreSQL.

```typescript
// shared/schema.ts - Complete Database Schema

import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// CAMERAS TABLE
// ============================================
// Stores information about CCTV cameras deployed
// across the four cities for accident monitoring
// ============================================

export const cameras = pgTable("cameras", {
  // Primary key - auto-incrementing integer
  id: serial("id").primaryKey(),
  
  // Human-readable camera name (e.g., "CAM-001")
  name: text("name").notNull(),
  
  // Physical location description
  // (e.g., "Rond Point Nlongkak, Central Yaounde")
  location: text("location").notNull(),
  
  // City where camera is deployed
  // Valid values: Yaounde, Douala, Bamenda, Buea
  city: text("city").notNull(),
  
  // GPS coordinates for map display
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Camera operational status
  // Valid values: active, inactive, maintenance
  status: text("status").default("active"),
  
  // RTSP stream URL for video feed access
  streamUrl: text("stream_url"),
  
  // Timestamp of when camera was added to system
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schema for camera insertion validation
export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof cameras.$inferSelect;

// ============================================
// CONTACTS TABLE
// ============================================
// Stores emergency responder contact information
// for alert notification dispatch
// ============================================

export const contacts = pgTable("contacts", {
  // Primary key
  id: serial("id").primaryKey(),
  
  // Contact name (person or organization)
  name: text("name").notNull(),
  
  // Phone number for SMS and voice alerts
  // Format: +237XXXXXXXXX (Cameroon) or international
  phone: text("phone").notNull(),
  
  // Email address for email notifications
  email: text("email"),
  
  // Contact type/category
  // Valid values: ambulance, police, fire, medical, dispatcher
  type: text("type").notNull(),
  
  // City assignment for location-based routing
  city: text("city"),
  
  // Whether contact should receive notifications
  isActive: boolean("is_active").default(true),
  
  // Timestamp of creation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// ============================================
// ALERTS TABLE
// ============================================
// Stores detected accident records with status
// tracking for emergency response workflow
// ============================================

export const alerts = pgTable("alerts", {
  // Primary key
  id: serial("id").primaryKey(),
  
  // Type of detected incident
  // Values: Vehicle Collision, Pedestrian Incident,
  //         Multi-Vehicle Accident, Hit and Run
  type: text("type").notNull(),
  
  // Location description from camera data
  location: text("location").notNull(),
  
  // Severity level based on detection analysis
  // Values: high, medium, low
  severity: text("severity").notNull(),
  
  // Current alert status
  // Values: pending, acknowledged, resolved, false_alarm
  status: text("status").default("pending"),
  
  // AI detection confidence (0-100)
  confidence: integer("confidence"),
  
  // Foreign key to camera that detected the incident
  cameraId: integer("camera_id"),
  
  // Tracking flags for notification dispatch
  smsSent: boolean("sms_sent").default(false),
  emailSent: boolean("email_sent").default(false),
  callMade: boolean("call_made").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  acknowledgedAt: true,
  resolvedAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// ============================================
// VIDEOS TABLE
// ============================================
// Stores uploaded video files for analysis
// ============================================

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  
  // Original filename
  filename: text("filename").notNull(),
  
  // File path on server storage
  filepath: text("filepath").notNull(),
  
  // File size in bytes
  size: integer("size"),
  
  // MIME type (video/mp4, video/avi, etc.)
  mimeType: text("mime_type"),
  
  // Processing status
  // Values: pending, processing, completed, failed
  status: text("status").default("pending"),
  
  // Processing results (JSON format)
  results: text("results"),
  
  // User who uploaded the video
  uploadedBy: text("uploaded_by"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

// ============================================
// SETTINGS TABLE
// ============================================
// Key-value store for system configuration
// ============================================

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  
  // Configuration key (unique identifier)
  key: text("key").notNull().unique(),
  
  // Configuration value (stored as text, parsed as needed)
  value: text("value"),
  
  // Human-readable description
  description: text("description"),
  
  // Last update timestamp
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// ============================================
// USERS TABLE
// ============================================
// User accounts with role-based access control
// ============================================

export const users = pgTable("users", {
  // User ID from authentication provider
  id: varchar("id", { length: 255 }).primaryKey(),
  
  // User email (unique identifier)
  email: varchar("email", { length: 255 }).unique(),
  
  // Name components
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  
  // Phone number
  phone: varchar("phone", { length: 20 }),
  
  // User role for access control
  // Values: dispatcher, police, ambulance, fire, admin
  role: varchar("role", { length: 50 }),
  
  // Assigned city
  city: varchar("city", { length: 50 }),
  
  // Organization affiliation
  organization: varchar("organization", { length: 255 }),
  
  // Profile image URL
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// ============================================
// SESSIONS TABLE
// ============================================
// Authentication session management
// ============================================

export const sessions = pgTable("sessions", {
  // Session ID
  sid: varchar("sid", { length: 255 }).primaryKey(),
  
  // Session data (JSON serialized)
  sess: text("sess").notNull(),
  
  // Session expiration timestamp
  expire: timestamp("expire").notNull(),
});

// ============================================
// CONVERSATIONS TABLE
// ============================================
// AI Assistant chat conversations
// ============================================

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  
  // Conversation title (auto-generated or user-set)
  title: text("title").default("New Chat"),
  
  // User who owns the conversation
  userId: text("user_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// ============================================
// MESSAGES TABLE
// ============================================
// Individual messages within conversations
// ============================================

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  
  // Foreign key to parent conversation
  conversationId: integer("conversation_id").notNull(),
  
  // Message role (user or assistant)
  role: text("role").notNull(),
  
  // Message content
  content: text("content").notNull(),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ============================================
// DETECTION LOGS TABLE
// ============================================
// Analytics data for detection performance tracking
// ============================================

export const detectionLogs = pgTable("detection_logs", {
  id: serial("id").primaryKey(),
  
  // Camera that generated the detection
  cameraId: integer("camera_id"),
  
  // Detection type
  detectionType: text("detection_type"),
  
  // Confidence score (0-100)
  confidence: integer("confidence"),
  
  // Whether detection was a true positive
  isValid: boolean("is_valid"),
  
  // Processing time in milliseconds
  processingTime: integer("processing_time"),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

export type DetectionLog = typeof detectionLogs.$inferSelect;
```

### A.2 Entity Relationship Diagram Description

The database schema implements the following relationships:

1. **Cameras to Alerts (One-to-Many)**
   - A camera can generate multiple alerts
   - Each alert references one camera through `cameraId`

2. **Users to Conversations (One-to-Many)**
   - A user can have multiple conversations
   - Each conversation references one user through `userId`

3. **Conversations to Messages (One-to-Many)**
   - A conversation contains multiple messages
   - Each message references one conversation through `conversationId`

4. **Cameras to DetectionLogs (One-to-Many)**
   - A camera generates multiple detection logs
   - Each log references one camera through `cameraId`

### A.3 Sample Data Seed Script

```typescript
// server/seed.ts - Database Seed Script

import { db } from "./db";
import { cameras, contacts, alerts, settings } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(alerts);
  await db.delete(contacts);
  await db.delete(cameras);
  await db.delete(settings);

  // Seed Cameras
  const cameraData = [
    // Yaounde Cameras (5)
    {
      name: "CAM-YDE-001",
      location: "Rond Point Nlongkak",
      city: "Yaounde",
      latitude: "3.8667",
      longitude: "11.5167",
      status: "active",
    },
    {
      name: "CAM-YDE-002",
      location: "Carrefour Bastos",
      city: "Yaounde",
      latitude: "3.8833",
      longitude: "11.5000",
      status: "active",
    },
    {
      name: "CAM-YDE-003",
      location: "Poste Centrale",
      city: "Yaounde",
      latitude: "3.8580",
      longitude: "11.5180",
      status: "active",
    },
    {
      name: "CAM-YDE-004",
      location: "Mvan",
      city: "Yaounde",
      latitude: "3.8350",
      longitude: "11.5050",
      status: "active",
    },
    {
      name: "CAM-YDE-005",
      location: "Mokolo Market",
      city: "Yaounde",
      latitude: "3.8720",
      longitude: "11.5100",
      status: "active",
    },
    
    // Douala Cameras (4)
    {
      name: "CAM-DLA-001",
      location: "Rond Point Deido",
      city: "Douala",
      latitude: "4.0511",
      longitude: "9.7679",
      status: "active",
    },
    {
      name: "CAM-DLA-002",
      location: "Akwa Palace",
      city: "Douala",
      latitude: "4.0483",
      longitude: "9.7042",
      status: "active",
    },
    {
      name: "CAM-DLA-003",
      location: "Bonapriso",
      city: "Douala",
      latitude: "4.0217",
      longitude: "9.6950",
      status: "active",
    },
    {
      name: "CAM-DLA-004",
      location: "Bepanda",
      city: "Douala",
      latitude: "4.0650",
      longitude: "9.7300",
      status: "active",
    },
    
    // Bamenda Cameras (3)
    {
      name: "CAM-BDA-001",
      location: "Commercial Avenue",
      city: "Bamenda",
      latitude: "5.9527",
      longitude: "10.1460",
      status: "active",
    },
    {
      name: "CAM-BDA-002",
      location: "Hospital Roundabout",
      city: "Bamenda",
      latitude: "5.9600",
      longitude: "10.1550",
      status: "active",
    },
    {
      name: "CAM-BDA-003",
      location: "Up Station",
      city: "Bamenda",
      latitude: "5.9700",
      longitude: "10.1400",
      status: "active",
    },
    
    // Buea Cameras (3)
    {
      name: "CAM-BUE-001",
      location: "Town Center",
      city: "Buea",
      latitude: "4.1527",
      longitude: "9.2319",
      status: "active",
    },
    {
      name: "CAM-BUE-002",
      location: "University Junction",
      city: "Buea",
      latitude: "4.1600",
      longitude: "9.2400",
      status: "active",
    },
    {
      name: "CAM-BUE-003",
      location: "Mile 17",
      city: "Buea",
      latitude: "4.1450",
      longitude: "9.2250",
      status: "active",
    },
  ];

  await db.insert(cameras).values(cameraData);
  console.log(`Inserted ${cameraData.length} cameras`);

  // Seed Contacts
  const contactData = [
    {
      name: "Central Hospital Yaounde",
      phone: "+237222234567",
      email: "emergency@chuy.cm",
      type: "ambulance",
      city: "Yaounde",
      isActive: true,
    },
    {
      name: "Traffic Police HQ Yaounde",
      phone: "+237222345678",
      email: "traffic@police.cm",
      type: "police",
      city: "Yaounde",
      isActive: true,
    },
    {
      name: "Fire Department Douala",
      phone: "+237233456789",
      email: "fire@douala.cm",
      type: "fire",
      city: "Douala",
      isActive: true,
    },
    {
      name: "SAMU Douala",
      phone: "+237233567890",
      email: "samu@douala.cm",
      type: "ambulance",
      city: "Douala",
      isActive: true,
    },
    {
      name: "Emergency Dispatcher",
      phone: "+237677890123",
      email: "dispatch@saferoute.cm",
      type: "dispatcher",
      city: "Yaounde",
      isActive: true,
    },
  ];

  await db.insert(contacts).values(contactData);
  console.log(`Inserted ${contactData.length} contacts`);

  // Seed Settings
  const settingsData = [
    { key: "smsAlerts", value: "true", description: "Enable SMS notifications" },
    { key: "voiceAlerts", value: "true", description: "Enable voice call notifications" },
    { key: "emailAlerts", value: "false", description: "Enable email notifications" },
    { key: "twilioPhoneNumber", value: "+18205008081", description: "Twilio phone number" },
    { key: "detectionThreshold", value: "90", description: "Min confidence for alerts" },
    { key: "countdownDuration", value: "10", description: "Alert countdown seconds" },
    { key: "yoloModel", value: "yolov8n", description: "YOLOv8 model variant" },
  ];

  await db.insert(settings).values(settingsData);
  console.log(`Inserted ${settingsData.length} settings`);

  // Seed Sample Alerts
  const alertData = [
    {
      type: "Vehicle Collision",
      location: "Rond Point Nlongkak, Yaounde",
      severity: "high",
      status: "resolved",
      confidence: 95,
      cameraId: 1,
      smsSent: true,
      callMade: true,
    },
    {
      type: "Pedestrian Incident",
      location: "Carrefour Bastos, Yaounde",
      severity: "medium",
      status: "acknowledged",
      confidence: 88,
      cameraId: 2,
      smsSent: true,
      callMade: false,
    },
    {
      type: "Multi-Vehicle Accident",
      location: "Rond Point Deido, Douala",
      severity: "high",
      status: "pending",
      confidence: 92,
      cameraId: 6,
      smsSent: false,
      callMade: false,
    },
  ];

  await db.insert(alerts).values(alertData);
  console.log(`Inserted ${alertData.length} sample alerts`);

  console.log("Database seeding completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
```

---

## APPENDIX B: API DOCUMENTATION

### B.1 Authentication Endpoints

#### GET /api/auth/user

Returns the currently authenticated user's information.

**Authentication Required**: Yes

**Response (200 OK)**:
```json
{
  "id": "user_abc123",
  "email": "officer@police.cm",
  "firstName": "Jean",
  "lastName": "Mbarga",
  "role": "police",
  "city": "Yaounde",
  "organization": "Traffic Police HQ",
  "profileImageUrl": null,
  "createdAt": "2026-02-05T10:30:00.000Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Not authenticated"
}
```

#### POST /api/auth/signup

Creates a new user account.

**Request Body**:
```json
{
  "firstName": "Jean",
  "lastName": "Mbarga",
  "email": "jean.mbarga@police.cm",
  "phone": "+237677123456",
  "role": "police",
  "city": "Yaounde",
  "organization": "Traffic Police HQ"
}
```

**Response (201 Created)**:
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "user_def456",
    "email": "jean.mbarga@police.cm",
    "firstName": "Jean",
    "lastName": "Mbarga",
    "role": "police",
    "city": "Yaounde"
  }
}
```

### B.2 Camera Endpoints

#### GET /api/cameras

Returns list of all cameras.

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "CAM-YDE-001",
    "location": "Rond Point Nlongkak",
    "city": "Yaounde",
    "latitude": "3.8667",
    "longitude": "11.5167",
    "status": "active",
    "streamUrl": null,
    "createdAt": "2026-02-05T08:00:00.000Z"
  }
]
```

#### GET /api/cameras/:id

Returns a specific camera by ID.

**Parameters**:
- `id` (path): Camera ID

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "CAM-YDE-001",
  "location": "Rond Point Nlongkak",
  "city": "Yaounde",
  "latitude": "3.8667",
  "longitude": "11.5167",
  "status": "active",
  "streamUrl": null,
  "createdAt": "2026-02-05T08:00:00.000Z"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Camera not found"
}
```

#### POST /api/cameras

Creates a new camera.

**Request Body**:
```json
{
  "name": "CAM-YDE-006",
  "location": "Nsam Junction",
  "city": "Yaounde",
  "latitude": "3.8400",
  "longitude": "11.4900",
  "status": "active",
  "streamUrl": "rtsp://192.168.1.100:554/stream"
}
```

**Response (201 Created)**:
```json
{
  "id": 16,
  "name": "CAM-YDE-006",
  "location": "Nsam Junction",
  "city": "Yaounde",
  "latitude": "3.8400",
  "longitude": "11.4900",
  "status": "active",
  "streamUrl": "rtsp://192.168.1.100:554/stream",
  "createdAt": "2026-02-05T14:30:00.000Z"
}
```

#### PATCH /api/cameras/:id

Updates an existing camera.

**Request Body** (partial update):
```json
{
  "status": "maintenance"
}
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "CAM-YDE-001",
  "location": "Rond Point Nlongkak",
  "city": "Yaounde",
  "status": "maintenance"
}
```

#### DELETE /api/cameras/:id

Deletes a camera.

**Response (200 OK)**:
```json
{
  "success": true
}
```

### B.3 Contact Endpoints

#### GET /api/contacts

Returns list of all emergency contacts.

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Central Hospital Yaounde",
    "phone": "+237222234567",
    "email": "emergency@chuy.cm",
    "type": "ambulance",
    "city": "Yaounde",
    "isActive": true,
    "createdAt": "2026-02-05T08:00:00.000Z"
  }
]
```

#### POST /api/contacts

Creates a new contact.

**Request Body**:
```json
{
  "name": "Provincial Hospital Bamenda",
  "phone": "+237233789012",
  "email": "emergency@phb.cm",
  "type": "ambulance",
  "city": "Bamenda",
  "isActive": true
}
```

### B.4 Alert Endpoints

#### GET /api/alerts

Returns list of all alerts.

**Query Parameters**:
- `status` (optional): Filter by status (pending, acknowledged, resolved, false_alarm)
- `severity` (optional): Filter by severity (high, medium, low)
- `city` (optional): Filter by city

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "type": "Vehicle Collision",
    "location": "Rond Point Nlongkak, Yaounde",
    "severity": "high",
    "status": "pending",
    "confidence": 95,
    "cameraId": 1,
    "smsSent": false,
    "emailSent": false,
    "callMade": false,
    "createdAt": "2026-02-05T14:32:15.000Z"
  }
]
```

#### POST /api/alerts

Creates a new alert.

**Request Body**:
```json
{
  "type": "Vehicle Collision",
  "location": "Carrefour Mvog-Mbi, Yaounde",
  "severity": "medium",
  "confidence": 88,
  "cameraId": 3
}
```

#### PATCH /api/alerts/:id

Updates an alert.

**Request Body**:
```json
{
  "status": "acknowledged"
}
```

#### POST /api/alerts/:id/send

Sends alert notifications to emergency contacts.

**Response (200 OK)**:
```json
{
  "success": true,
  "sms": [
    { "contact": "Central Hospital Yaounde", "success": true },
    { "contact": "Traffic Police HQ", "success": true }
  ],
  "voice": [
    { "contact": "Central Hospital Yaounde", "success": true }
  ]
}
```

**Response (400 Bad Request)** - Already sent:
```json
{
  "message": "Alerts already sent",
  "already_sent": true
}
```

**Response (400 Bad Request)** - Cancelled:
```json
{
  "error": "Cannot send alerts for cancelled or resolved incidents"
}
```

### B.5 Settings Endpoints

#### GET /api/settings

Returns all system settings.

**Response (200 OK)**:
```json
[
  { "id": 1, "key": "smsAlerts", "value": "true" },
  { "id": 2, "key": "voiceAlerts", "value": "true" },
  { "id": 3, "key": "twilioPhoneNumber", "value": "+18205008081" }
]
```

#### PUT /api/settings

Updates system settings.

**Request Body**:
```json
{
  "smsAlerts": "true",
  "voiceAlerts": "false",
  "detectionThreshold": "85"
}
```

### B.6 Conversation Endpoints (AI Assistant)

#### GET /api/conversations

Returns list of user's conversations.

#### POST /api/conversations

Creates a new conversation.

**Request Body**:
```json
{
  "title": "Help with Camera Setup"
}
```

#### POST /api/conversations/:id/messages

Sends a message and receives AI response (Server-Sent Events).

**Request Body**:
```json
{
  "content": "How do I add a new camera to the system?"
}
```

**Response**: Server-Sent Events stream
```
data: {"content": "To add a new camera to SAFEROUTE CM, follow these steps:\n\n"}
data: {"content": "1. Navigate to the Cameras page\n"}
data: {"content": "2. Click the 'Add Camera' button\n"}
data: {"done": true}
```

---

## APPENDIX C: SOURCE CODE EXCERPTS

### C.1 Accident Notification Component

```typescript
// client/src/components/accident-notification.tsx

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, X, Volume2, VolumeX } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Alert } from "@shared/schema";

interface AccidentNotificationProps {
  alert: Alert;
  onDismiss: () => void;
}

export function AccidentNotification({ alert, onDismiss }: AccidentNotificationProps) {
  const [countdown, setCountdown] = useState(10);
  const [isMuted, setIsMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Beep sound using Web Audio API
  const playBeep = useCallback(() => {
    if (isMuted) return;
    
    try {
      const audioContext = new (window.AudioContext || 
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  }, [isMuted]);

  // Send alert mutation
  const sendAlertMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/alerts/${alert.id}/send`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.already_sent) {
        toast({
          title: "Already Sent",
          description: "Alerts have already been dispatched.",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        toast({
          title: "Alerts Sent",
          description: "Emergency responders have been notified.",
        });
      }
      onDismiss();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send alerts. Please try again.",
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  // Cancel alert mutation
  const cancelAlertMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/alerts/${alert.id}`, { 
        status: "false_alarm" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Cancelled",
        description: "This alert has been marked as a false alarm.",
      });
      onDismiss();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = useCallback(() => {
    setIsSending(true);
    sendAlertMutation.mutate();
  }, [sendAlertMutation]);

  const handleCancel = useCallback(() => {
    cancelAlertMutation.mutate();
  }, [cancelAlertMutation]);

  // Countdown timer with beep
  useEffect(() => {
    playBeep();
    
    const beepInterval = setInterval(() => {
      playBeep();
    }, 1000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(beepInterval);
          handleSend();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(beepInterval);
      clearInterval(countdownInterval);
    };
  }, [playBeep, handleSend]);

  const severityColors = {
    high: "destructive",
    medium: "warning",
    low: "secondary",
  } as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-destructive animate-pulse">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <CardTitle>Accident Detected!</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-destructive-foreground hover:bg-destructive-foreground/20"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="font-medium">{alert.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Location:</span>
              <span className="font-medium">{alert.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Severity:</span>
              <Badge variant={severityColors[alert.severity as keyof typeof severityColors]}>
                {alert.severity.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Confidence:</span>
              <span className="font-medium">{alert.confidence}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Auto-sending in:</span>
              <span className="font-bold text-destructive">{countdown}s</span>
            </div>
            <Progress 
              value={(countdown / 10) * 100} 
              className="h-3"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isSending || cancelAlertMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel (False Alarm)
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSend}
              disabled={isSending || sendAlertMutation.isPending}
            >
              <Phone className="mr-2 h-4 w-4" />
              Send Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### C.2 Twilio Notification Service

```typescript
// server/twilio.ts

import Twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = accountSid && authToken 
  ? Twilio(accountSid, authToken) 
  : null;

export function isTwilioConfigured(): boolean {
  return !!twilioClient;
}

interface NotificationParams {
  to: string;
  alertType: string;
  location: string;
  severity: string;
  confidence?: number;
  cameraName?: string;
}

export async function sendSMS(
  params: NotificationParams,
  fromNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient) {
    return { success: false, error: "Twilio not configured" };
  }

  const message = `
🚨 SAFEROUTE ALERT 🚨
Type: ${params.alertType}
Location: ${params.location}
Severity: ${params.severity.toUpperCase()}
${params.confidence ? `Confidence: ${params.confidence}%` : ""}
${params.cameraName ? `Camera: ${params.cameraName}` : ""}
Time: ${new Date().toLocaleString()}

Please respond immediately.
  `.trim();

  try {
    await twilioClient.messages.create({
      body: message,
      to: params.to,
      from: fromNumber,
    });
    return { success: true };
  } catch (error: any) {
    console.error("SMS send error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function makeVoiceCall(
  params: NotificationParams,
  fromNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient) {
    return { success: false, error: "Twilio not configured" };
  }

  const twiml = `
    <Response>
      <Say voice="alice">
        This is an emergency alert from SafeRoute C M.
        A ${params.alertType} has been detected at ${params.location}.
        The severity level is ${params.severity}.
        Please dispatch emergency services immediately.
      </Say>
      <Pause length="1"/>
      <Say voice="alice">
        Repeating. ${params.alertType} at ${params.location}.
        Severity ${params.severity}. Respond immediately.
      </Say>
    </Response>
  `;

  try {
    await twilioClient.calls.create({
      twiml: twiml,
      to: params.to,
      from: fromNumber,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Voice call error:", error.message);
    return { success: false, error: error.message };
  }
}
```

### C.3 Storage Interface

```typescript
// server/storage.ts (excerpt)

export interface IStorage {
  // Camera operations
  getCameras(): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(data: InsertCamera): Promise<Camera>;
  updateCamera(id: number, data: Partial<InsertCamera>): Promise<Camera | undefined>;
  deleteCamera(id: number): Promise<boolean>;

  // Contact operations
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(data: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Alert operations
  getAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  createAlert(data: InsertAlert): Promise<Alert>;
  updateAlert(id: number, data: Partial<InsertAlert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Setting[]>;
  saveSetting(key: string, value: string): Promise<void>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(data: UpsertUser): Promise<User>;
}
```

---

## APPENDIX D: USER SURVEY QUESTIONNAIRE

### SAFEROUTE CM User Acceptance Testing Survey

**Section A: Participant Information**

1. What is your role?
   - [ ] Traffic Police Officer
   - [ ] Ambulance/Medical Personnel
   - [ ] Fire Department Personnel
   - [ ] Traffic Management Staff
   - [ ] Other: ____________

2. How many years of experience do you have in emergency response?
   - [ ] Less than 1 year
   - [ ] 1-3 years
   - [ ] 3-5 years
   - [ ] More than 5 years

3. How would you rate your comfort level with technology?
   - [ ] Very Comfortable
   - [ ] Comfortable
   - [ ] Neutral
   - [ ] Uncomfortable
   - [ ] Very Uncomfortable

**Section B: System Usability (Rate 1-5, where 1=Strongly Disagree, 5=Strongly Agree)**

4. The system interface is easy to understand and navigate.
   1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

5. I was able to complete tasks without additional help.
   1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

6. The information displayed is relevant to my work.
   1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

7. The response time of the system is acceptable.
   1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

8. The visual design is professional and appropriate.
   1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

**Section C: Alert System (Rate 1-5)**

9. The alert notifications are timely and attention-grabbing.
   1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

10. The countdown timer provides adequate time to cancel false alarms.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

11. The alert information is sufficient for making response decisions.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

12. The audio alerts are effective in getting attention.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

**Section D: Role-Specific Features (Rate 1-5)**

13. My role-specific dashboard meets my operational needs.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

14. The quick action buttons are useful for my tasks.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

15. The status tracking features are helpful.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

**Section E: Overall Assessment (Rate 1-5)**

16. Overall, I am satisfied with the SAFEROUTE CM system.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

17. I would recommend this system to colleagues.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

18. This system would improve my work effectiveness.
    1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ]

**Section F: Open-Ended Questions**

19. What features of the system did you find most useful?
    ________________________________________________________________
    ________________________________________________________________

20. What improvements would you suggest for the system?
    ________________________________________________________________
    ________________________________________________________________

21. Are there any features you would like to see added?
    ________________________________________________________________
    ________________________________________________________________

22. Any other comments or feedback?
    ________________________________________________________________
    ________________________________________________________________

**Thank you for your participation!**

---

## APPENDIX E: TEST RESULTS DATA

### E.1 Functional Test Results Summary

| Test Category | Total Tests | Passed | Failed | Pass Rate |
|---------------|-------------|--------|--------|-----------|
| Authentication | 8 | 8 | 0 | 100% |
| Camera Management | 12 | 12 | 0 | 100% |
| Contact Management | 10 | 10 | 0 | 100% |
| Alert Management | 15 | 14 | 1 | 93.3% |
| Notification System | 8 | 8 | 0 | 100% |
| Role Dashboards | 12 | 12 | 0 | 100% |
| AI Assistant | 6 | 5 | 1 | 83.3% |
| Settings | 8 | 8 | 0 | 100% |
| **TOTAL** | **79** | **77** | **2** | **97.5%** |

### E.2 Performance Test Results

| Metric | Test 1 | Test 2 | Test 3 | Test 4 | Test 5 | Average |
|--------|--------|--------|--------|--------|--------|---------|
| Page Load Time (ms) | 1820 | 1750 | 1890 | 1680 | 1760 | 1780 |
| API Response Time (ms) | 142 | 158 | 135 | 149 | 141 | 145 |
| Alert Dispatch Time (ms) | 3620 | 3850 | 3540 | 3780 | 3710 | 3700 |
| Database Query Time (ms) | 48 | 42 | 51 | 38 | 46 | 45 |

### E.3 User Acceptance Test Scores

| Participant | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Q11 | Q12 | Q13 | Q14 | Q15 | Q16 | Q17 | Q18 | Avg |
|-------------|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| P1 (Police) | 4 | 4 | 5 | 4 | 5 | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 5 | 5 | 5 | 4.5 |
| P2 (Police) | 4 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | 4.4 |
| P3 (Police) | 5 | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 4.5 |
| P4 (Police) | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4.2 |
| P5 (Police) | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 4.6 |
| P6 (Ambulance) | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | 5 | 4.6 |
| P7 (Ambulance) | 4 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 4 | 4.4 |
| P8 (Ambulance) | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4.1 |
| P9 (Fire) | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 4.9 |
| P10 (Fire) | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4.1 |
| P11 (Traffic) | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 4.6 |
| P12 (Traffic) | 5 | 5 | 4 | 5 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 4.4 |
| **Average** | **4.3** | **4.3** | **4.5** | **4.3** | **4.4** | **4.6** | **4.4** | **4.4** | **4.5** | **4.5** | **4.4** | **4.3** | **4.5** | **4.5** | **4.5** | **4.4** |

---

*End of Appendices*
