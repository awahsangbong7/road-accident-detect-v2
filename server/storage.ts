import { db } from "./db";
import { eq, desc, and, isNull, or } from "drizzle-orm";
import {
  users,
  cameras,
  contacts,
  videos,
  alerts,
  settings,
  conversations,
  messages,
  detectionLogs,
  type User,
  type InsertUser,
  type Camera,
  type InsertCamera,
  type Contact,
  type InsertContact,
  type Video,
  type InsertVideo,
  type Alert,
  type InsertAlert,
  type Setting,
  type InsertSetting,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type DetectionLog,
  type InsertDetectionLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCameras(userId: string): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, data: Partial<InsertCamera>): Promise<Camera | undefined>;
  deleteCamera(id: number): Promise<boolean>;

  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  getVideos(userId: string): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, data: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;

  getAlerts(userId: string): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, data: Partial<InsertAlert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;

  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;

  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<(Conversation & { messages: Message[] }) | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<boolean>;

  createMessage(message: InsertMessage): Promise<Message>;

  createDetectionLog(log: InsertDetectionLog): Promise<DetectionLog>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getCameras(userId: string): Promise<Camera[]> {
    return db.select().from(cameras)
      .where(eq(cameras.userId, userId))
      .orderBy(desc(cameras.createdAt));
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    const [camera] = await db.select().from(cameras).where(eq(cameras.id, id));
    return camera;
  }

  async createCamera(camera: InsertCamera): Promise<Camera> {
    const [newCamera] = await db.insert(cameras).values(camera).returning();
    return newCamera;
  }

  async updateCamera(id: number, data: Partial<InsertCamera>): Promise<Camera | undefined> {
    const [updatedCamera] = await db
      .update(cameras)
      .set(data)
      .where(eq(cameras.id, id))
      .returning();
    return updatedCamera;
  }

  async deleteCamera(id: number): Promise<boolean> {
    await db.delete(cameras).where(eq(cameras.id, id));
    return true;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return db.select().from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.priority);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  async getVideos(userId: string): Promise<Video[]> {
    return db.select().from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async updateVideo(id: number, data: Partial<InsertVideo>): Promise<Video | undefined> {
    const [updatedVideo] = await db
      .update(videos)
      .set(data)
      .where(eq(videos.id, id))
      .returning();
    return updatedVideo;
  }

  async deleteVideo(id: number): Promise<boolean> {
    await db.delete(videos).where(eq(videos.id, id));
    return true;
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    return db.select().from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async updateAlert(id: number, data: Partial<InsertAlert>): Promise<Alert | undefined> {
    const [updatedAlert] = await db
      .update(alerts)
      .set(data)
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    await db.delete(alerts).where(eq(alerts.id, id));
    return true;
  }

  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async upsertSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value: setting.value, category: setting.category, description: setting.description })
        .where(eq(settings.key, setting.key))
        .returning();
      return updated;
    }
    const [newSetting] = await db.insert(settings).values(setting).returning();
    return newSetting;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: number): Promise<(Conversation & { messages: Message[] }) | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conversation) return undefined;
    
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    
    return { ...conversation, messages: conversationMessages };
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    return true;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async createDetectionLog(log: InsertDetectionLog): Promise<DetectionLog> {
    const [newLog] = await db.insert(detectionLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
