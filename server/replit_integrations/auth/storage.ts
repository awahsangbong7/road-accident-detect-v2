import { users, type User, type UpsertUser } from "../../../shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id!);
    if (existing) {
      const [user] = await db
        .update(users)
        .set({
          email: userData.email ?? existing.email,
          firstName: userData.firstName ?? existing.firstName,
          lastName: userData.lastName ?? existing.lastName,
          profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      return user;
    }

    if (userData.email) {
      const [emailUser] = await db.select().from(users).where(eq(users.email, userData.email));
      if (emailUser) {
        await db.delete(users).where(eq(users.id, emailUser.id));
        const [user] = await db.insert(users).values({
          id: userData.id,
          email: emailUser.email,
          firstName: userData.firstName ?? emailUser.firstName,
          lastName: userData.lastName ?? emailUser.lastName,
          profileImageUrl: userData.profileImageUrl ?? emailUser.profileImageUrl,
          role: emailUser.role,
          organization: emailUser.organization,
          phone: emailUser.phone,
          city: emailUser.city,
          isActive: emailUser.isActive,
        }).returning();
        return user;
      }
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
