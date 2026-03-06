import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models (IMPORTANT: mandatory for Replit Auth)
export * from "./models/auth";

// Cameras table - CCTV camera locations
export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  status: text("status").notNull().default("active"),
  streamUrl: text("stream_url"),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  createdAt: true,
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;

// Contacts table - Emergency responders
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  organization: text("organization"),
  priority: integer("priority").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Videos table - Uploaded video files
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  duration: real("duration"),
  format: text("format").notNull(),
  status: text("status").notNull().default("pending"),
  cameraId: integer("camera_id"),
  processedFrames: integer("processed_frames").default(0),
  totalFrames: integer("total_frames"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

// Alerts table - Detected accidents
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  cameraId: integer("camera_id"),
  videoId: integer("video_id"),
  type: text("type").notNull().default("collision"),
  severity: text("severity").notNull().default("high"),
  confidence: real("confidence").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at"),
  smsSent: boolean("sms_sent").default(false),
  emailSent: boolean("email_sent").default(false),
  callMade: boolean("call_made").default(false),
  detectedAt: timestamp("detected_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  detectedAt: true,
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Settings table - System configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull().default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Chat conversations for AI assistant
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Detection logs for analytics
export const detectionLogs = pgTable("detection_logs", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id"),
  cameraId: integer("camera_id"),
  frameNumber: integer("frame_number"),
  objectsDetected: integer("objects_detected").default(0),
  vehiclesCount: integer("vehicles_count").default(0),
  pedestriansCount: integer("pedestrians_count").default(0),
  anomalyScore: real("anomaly_score").default(0),
  processingTime: real("processing_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertDetectionLogSchema = createInsertSchema(detectionLogs).omit({
  id: true,
  createdAt: true,
});

export type DetectionLog = typeof detectionLogs.$inferSelect;
export type InsertDetectionLog = z.infer<typeof insertDetectionLogSchema>;
