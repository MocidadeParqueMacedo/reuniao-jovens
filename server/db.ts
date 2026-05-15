import { callDataApi } from "./_core/dataApi";
import { users, members, meetings, presenca, visitas, atas, versinhos, eventos } from "@/drizzle/schema";
import type { User, InsertUser } from "@/drizzle/schema";
import * as crypto from "crypto";

// ─── User Management (OAuth) ───────────────────────────────────────────────────────

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "users",
      where: { openId },
    },
  });
  const rows = (result as any)?.rows || [];
  return rows.length > 0 ? rows[0] : null;
}

export async function upsertUser(data: Partial<InsertUser>): Promise<User> {
  const result = await callDataApi("Database/Upsert", {
    body: {
      table: "users",
      data,
      uniqueKey: "openId",
    },
  });
  return (result as any)?.record || data;
}

// ─── User Management (Email/Password) ───────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "users",
      where: { email },
    },
  });
  const rows = (result as any)?.rows || [];
  return rows.length > 0 ? rows[0] : null;
}

export async function createUser(
  email: string,
  password?: string,
  role: "user" | "admin" | "auxiliar" = "user"
): Promise<User> {
  const hashedPassword = password ? crypto.createHash("sha256").update(password).digest("hex") : null;

  const result = await callDataApi("Database/Insert", {
    body: {
      table: "users",
      data: {
        email,
        password: hashedPassword,
        role,
        status: role === "admin" ? "aprovado" : "pendente",
        createdAt: new Date(),
      },
    },
  });

  return (result as any)?.record || { email, role, status: role === "admin" ? "aprovado" : "pendente" };
}

export async function googleLogin(email: string): Promise<User> {
  let user = await getUserByEmail(email);

  if (!user) {
    // Se é o email do admin, criar como admin automático
    const isAdminEmail = email === "elias.g.alameda@gmail.com";
    user = await createUser(email, undefined, isAdminEmail ? "admin" : "user");
  }

  return user;
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  // Para OAuth users, não há password
  if (!user.loginMethod || user.loginMethod === "email") {
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    // Comparar com o password armazenado (se existir)
    // Por enquanto, retornar null se não houver match
    return null;
  }

  return user;
}

export async function listPendingUsers(): Promise<User[]> {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "users",
      where: { status: "pendente" },
    },
  });
  return (result as any)?.rows || [];
}

export async function approveUser(userId: number): Promise<void> {
  await callDataApi("Database/Update", {
    body: {
      table: "users",
      where: { id: userId },
      data: { status: "aprovado" },
    },
  });
}

export async function rejectUser(userId: number): Promise<void> {
  await callDataApi("Database/Update", {
    body: {
      table: "users",
      where: { id: userId },
      data: { status: "rejeitado" },
    },
  });
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "auxiliar"): Promise<void> {
  await callDataApi("Database/Update", {
    body: {
      table: "users",
      where: { id: userId },
      data: { role },
    },
  });
}

// ─── Member Management ───────────────────────────────────────────────────────

export async function listMembers() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "members",
    },
  });
  return (result as any)?.rows || [];
}

export async function createMember(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "members",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updateMember(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "members",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

export async function deleteMember(id: number) {
  await callDataApi("Database/Delete", {
    body: {
      table: "members",
      where: { id },
    },
  });
  return { success: true };
}

// ─── Meeting Management ───────────────────────────────────────────────────────

export async function listMeetings() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "meetings",
    },
  });
  return (result as any)?.rows || [];
}

export async function createMeeting(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "meetings",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updateMeeting(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "meetings",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

// ─── Presença Management ───────────────────────────────────────────────────────

export async function getPresencaByMeeting(meetingId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "presenca",
      where: { meetingId },
    },
  });
  return (result as any)?.rows || [];
}

export async function createPresenca(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "presenca",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updatePresenca(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "presenca",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

// ─── Visitas Management ───────────────────────────────────────────────────────

export async function listVisitas() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "visitas",
    },
  });
  return (result as any)?.rows || [];
}

export async function createVisita(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "visitas",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updateVisita(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "visitas",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

export async function deleteVisita(id: number) {
  await callDataApi("Database/Delete", {
    body: {
      table: "visitas",
      where: { id },
    },
  });
  return { success: true };
}

// ─── Atas Management ───────────────────────────────────────────────────────

export async function listAtas() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "atas",
    },
  });
  return (result as any)?.rows || [];
}

export async function createAta(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "atas",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updateAta(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "atas",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

export async function deleteAta(id: number) {
  await callDataApi("Database/Delete", {
    body: {
      table: "atas",
      where: { id },
    },
  });
  return { success: true };
}

// ─── Versinhos Management ───────────────────────────────────────────────────────

export async function listVersinhos() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "versinhos",
    },
  });
  return (result as any)?.rows || [];
}

export async function createVersinho(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "versinhos",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updateVersinho(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "versinhos",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

export async function deleteVersinho(id: number) {
  await callDataApi("Database/Delete", {
    body: {
      table: "versinhos",
      where: { id },
    },
  });
  return { success: true };
}

// ─── Eventos Management ───────────────────────────────────────────────────────

export async function listEventos() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "eventos",
    },
  });
  return (result as any)?.rows || [];
}

export async function createEvento(data: any) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "eventos",
      data,
    },
  });
  return (result as any)?.record || data;
}

export async function updateEvento(id: number, data: any) {
  await callDataApi("Database/Update", {
    body: {
      table: "eventos",
      where: { id },
      data,
    },
  });
  return { id, ...data };
}

export async function deleteEvento(id: number) {
  await callDataApi("Database/Delete", {
    body: {
      table: "eventos",
      where: { id },
    },
  });
  return { success: true };
}
