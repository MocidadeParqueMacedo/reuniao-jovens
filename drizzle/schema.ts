import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "auxiliar"]).default("user").notNull(),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabelas para Reunião de Jovens
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  genero: varchar("genero", { length: 1 }).notNull(), // M ou F
  continuacao: int("continuacao").notNull(), // 1-5
  dataNascimento: varchar("dataNascimento", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  isScheduled: int("isScheduled").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const presenca = mysqlTable("presenca", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull(),
  memberId: int("memberId").notNull(),
  presente: int("presente").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const visitas = mysqlTable("visitas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  data: varchar("data", { length: 10 }),
  realizada: int("realizada").default(0).notNull(),
  endereco: text("endereco"),
  horario: varchar("horario", { length: 5 }),
  observacoes: text("observacoes"),
  tipo: varchar("tipo", { length: 20 }), // 'local' ou 'comum'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const atas = mysqlTable("atas", {
  id: int("id").autoincrement().primaryKey(),
  data: varchar("data", { length: 10 }).notNull(),
  conteudo: text("conteudo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const versinhos = mysqlTable("versinhos", {
  id: int("id").autoincrement().primaryKey(),
  livro: varchar("livro", { length: 50 }).notNull(),
  capitulo: int("capitulo").notNull(),
  versiculo: int("versiculo").notNull(),
  ordem: int("ordem").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const eventos = mysqlTable("eventos", {
  id: int("id").autoincrement().primaryKey(),
  data: varchar("data", { length: 10 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'reuniao', 'evento', 'aniversario', 'visita'
  titulo: varchar("titulo", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;
export type Presenca = typeof presenca.$inferSelect;
export type InsertPresenca = typeof presenca.$inferInsert;
export type Visita = typeof visitas.$inferSelect;
export type InsertVisita = typeof visitas.$inferInsert;
export type Ata = typeof atas.$inferSelect;
export type InsertAta = typeof atas.$inferInsert;
export type Versinho = typeof versinhos.$inferSelect;
export type InsertVersinho = typeof versinhos.$inferInsert;
export type Evento = typeof eventos.$inferSelect;
export type InsertEvento = typeof eventos.$inferInsert;
