import { db } from "./db";
import { contacts, cameras } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function seedIfEmpty() {
}

export async function seedUserData(userId: string) {
  const existingContacts = await db.select().from(contacts).where(eq(contacts.userId, userId));
  if (existingContacts.length > 0) return;

  const existingCameras = await db.select().from(cameras).where(eq(cameras.userId, userId));
  if (existingCameras.length > 0) return;

  const userContacts = [
    { name: "Hopital Central de Yaounde", role: "hospital", phone: "+237 222 231 404", email: "urgences@hcy.cm", organization: "Hopital Central de Yaounde", priority: 1, isActive: true, userId },
    { name: "CHU de Yaounde", role: "hospital", phone: "+237 222 231 234", email: "urgences@chu-yaounde.cm", organization: "Centre Hospitalier Universitaire de Yaounde", priority: 1, isActive: true, userId },
    { name: "Hopital General de Douala", role: "hospital", phone: "+237 233 426 020", email: "urgences@hgd.cm", organization: "Hopital General de Douala", priority: 1, isActive: true, userId },
    { name: "Hopital Laquintinie de Douala", role: "hospital", phone: "+237 233 424 612", email: "urgences@laquintinie.cm", organization: "Hopital Laquintinie de Douala", priority: 1, isActive: true, userId },
    { name: "Bamenda Regional Hospital", role: "hospital", phone: "+237 233 361 222", email: "urgences@brh.cm", organization: "Bamenda Regional Hospital", priority: 1, isActive: true, userId },
    { name: "Buea Regional Hospital", role: "hospital", phone: "+237 233 322 156", email: "urgences@buea-rh.cm", organization: "Buea Regional Hospital", priority: 1, isActive: true, userId },
    { name: "Commissariat Central Yaounde", role: "police", phone: "+237 222 234 567", email: "contact@police-yaounde.cm", organization: "Police Nationale - Yaounde", priority: 1, isActive: true, userId },
    { name: "Commissariat Central Douala", role: "police", phone: "+237 233 428 901", email: "contact@police-douala.cm", organization: "Police Nationale - Douala", priority: 1, isActive: true, userId },
    { name: "Sapeurs-Pompiers de Yaounde", role: "fire", phone: "+237 118", email: "urgences@pompiers-yaounde.cm", organization: "Corps National des Sapeurs-Pompiers - Yaounde", priority: 1, isActive: true, userId },
    { name: "Sapeurs-Pompiers de Douala", role: "fire", phone: "+237 118", email: "urgences@pompiers-douala.cm", organization: "Corps National des Sapeurs-Pompiers - Douala", priority: 1, isActive: true, userId },
  ];

  await db.insert(contacts).values(userContacts).onConflictDoNothing();

  const userCameras = [
    { name: "Rond-Point Nlongkak Cam", location: "Rond-Point Nlongkak, Avenue Kennedy, Yaounde", latitude: 3.8745, longitude: 11.5107, status: "active", description: "Main junction camera covering 4-way intersection", userId },
    { name: "Carrefour Mvog-Mbi Cam", location: "Carrefour Mvog-Mbi, Rue de Mvog-Mbi, Yaounde", latitude: 3.8561, longitude: 11.5142, status: "active", description: "Market area traffic camera", userId },
    { name: "Rond-Point Deido Cam", location: "Rond-Point Deido, Boulevard de la Liberte, Douala", latitude: 4.0559, longitude: 9.7085, status: "active", description: "Commercial district monitoring", userId },
    { name: "Pont du Wouri Cam", location: "Pont du Wouri (Wouri Bridge), Bonaberi, Douala", latitude: 4.0673, longitude: 9.6874, status: "active", description: "Bridge traffic monitoring", userId },
    { name: "Commercial Avenue Cam", location: "Commercial Avenue, Bamenda", latitude: 5.9565, longitude: 10.1453, status: "active", description: "Main commercial area traffic monitoring", userId },
    { name: "Buea Town Roundabout Cam", location: "Buea Town Roundabout, Main St, Buea", latitude: 4.1553, longitude: 9.2313, status: "active", description: "Town center monitoring", userId },
  ];

  await db.insert(cameras).values(userCameras).onConflictDoNothing();
}
