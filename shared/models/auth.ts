import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("dispatcher"), // admin, dispatcher, police, ambulance, fire, hospital
  organization: varchar("organization"),
  phone: varchar("phone"),
  city: varchar("city"), // Yaounde, Bamenda, Buea, Douala
  isActive: varchar("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User roles enum for type safety
export const UserRoles = {
  ADMIN: "admin",
  DISPATCHER: "dispatcher",
  POLICE: "police", 
  AMBULANCE: "ambulance",
  FIRE: "fire",
  HOSPITAL: "hospital",
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// Cities enum
export const Cities = {
  YAOUNDE: "Yaounde",
  BAMENDA: "Bamenda",
  BUEA: "Buea",
  DOUALA: "Douala",
} as const;

export type City = typeof Cities[keyof typeof Cities];
