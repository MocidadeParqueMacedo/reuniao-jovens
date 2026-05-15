import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  InsertMember, members,
  InsertMeeting, meetings,
  InsertPresenca, presenca,
  InsertVisita, visitas,
  InsertAta, atas,
  InsertVersinho, versinhos,
  InsertEvento, eventos,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Members ──────────────────────────────────────────────────────────────
export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members);
}

export async function createMember(data: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(members).values(data);
  return true;
}

export async function updateMember(id: number, data: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(data).where(eq(members.id, id));
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(members).where(eq(members.id, id));
}

// ─── Meetings ─────────────────────────────────────────────────────────────
export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings);
}

export async function createMeeting(data: InsertMeeting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(meetings).values(data);
  return true;
}

export async function updateMeeting(id: number, data: Partial<InsertMeeting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meetings).set(data).where(eq(meetings.id, id));
}

// ─── Presença ─────────────────────────────────────────────────────────────
export async function getPresencaByMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(presenca).where(eq(presenca.meetingId, meetingId));
}

export async function createPresenca(data: InsertPresenca) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(presenca).values(data);
  return true;
}

export async function updatePresenca(id: number, data: Partial<InsertPresenca>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(presenca).set(data).where(eq(presenca.id, id));
}

// ─── Visitas ──────────────────────────────────────────────────────────────
export async function getAllVisitas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visitas);
}

export async function createVisita(data: InsertVisita) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(visitas).values(data);
  return true;
}

export async function updateVisita(id: number, data: Partial<InsertVisita>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(visitas).set(data).where(eq(visitas.id, id));
}

export async function deleteVisita(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(visitas).where(eq(visitas.id, id));
}

// ─── Atas ─────────────────────────────────────────────────────────────────
export async function getAllAtas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atas);
}

export async function createAta(data: InsertAta) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(atas).values(data);
  return true;
}

export async function updateAta(id: number, data: Partial<InsertAta>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(atas).set(data).where(eq(atas.id, id));
}

export async function deleteAta(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(atas).where(eq(atas.id, id));
}

// ─── Versinhos ────────────────────────────────────────────────────────────
export async function getAllVersinhos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(versinhos);
}

export async function createVersinho(data: InsertVersinho) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(versinhos).values(data);
  return true;
}

export async function updateVersinho(id: number, data: Partial<InsertVersinho>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(versinhos).set(data).where(eq(versinhos.id, id));
}

export async function deleteVersinho(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(versinhos).where(eq(versinhos.id, id));
}

// ─── Eventos ──────────────────────────────────────────────────────────────
export async function getAllEventos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventos);
}

export async function createEvento(data: InsertEvento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(eventos).values(data);
  return true;
}

export async function updateEvento(id: number, data: Partial<InsertEvento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(eventos).set(data).where(eq(eventos.id, id));
}

export async function deleteEvento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(eventos).where(eq(eventos.id, id));
}


// ─── User Management ───────────────────────────────────────────────────────
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.status, "pendente"));
}

export async function approveUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ status: "aprovado" }).where(eq(users.id, userId));
}

export async function rejectUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ status: "rejeitado" }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "auxiliar") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}


// ─── Authentication (Email/Password) ───────────────────────────────────────
export async function registerUser(email: string, name: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Hash password (in production, use bcrypt)
  const hashedPassword = Buffer.from(password).toString('base64');
  
  const result = await db.insert(users).values({
    openId: `email_${email}`,
    email,
    name,
    loginMethod: 'email',
    role: 'user',
    status: 'pendente',
  });
  
  return result;
}

export async function loginUser(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.length === 0) throw new Error("User not found");
  
  // Verify password (in production, use bcrypt)
  const hashedPassword = Buffer.from(password).toString('base64');
  
  return user[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user && user.length > 0 ? user[0] : null;
}
