import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User Management (Admin only)
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return db.getAllUsers();
    }),
    pending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return db.getPendingUsers();
    }),
    approve: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        await db.approveUser(input.userId);
        return { success: true };
      }),
    reject: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        await db.rejectUser(input.userId);
        return { success: true };
      }),
    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "auxiliar"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // Reunião de Jovens API
  members: router({
    list: publicProcedure.query(() => db.getAllMembers()),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        genero: z.string(),
        continuacao: z.number(),
        dataNascimento: z.string().optional(),
      }))
      .mutation(({ input }) => db.createMember(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        genero: z.string().optional(),
        continuacao: z.number().optional(),
        dataNascimento: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateMember(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMember(input.id)),
  }),

  meetings: router({
    list: publicProcedure.query(() => db.getAllMeetings()),
    create: protectedProcedure
      .input(z.object({
        date: z.string(),
        isScheduled: z.number().optional(),
      }))
      .mutation(({ input }) => db.createMeeting(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.string().optional(),
        isScheduled: z.number().optional(),
      }))
      .mutation(({ input }) => db.updateMeeting(input.id, input)),
  }),

  presenca: router({
    byMeeting: publicProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(({ input }) => db.getPresencaByMeeting(input.meetingId)),
    create: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        memberId: z.number(),
        presente: z.number(),
      }))
      .mutation(({ input }) => db.createPresenca(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        presente: z.number().optional(),
      }))
      .mutation(({ input }) => db.updatePresenca(input.id, input)),
  }),

  visitas: router({
    list: publicProcedure.query(() => db.getAllVisitas()),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        data: z.string().optional(),
        realizada: z.number().optional(),
        endereco: z.string().optional(),
        horario: z.string().optional(),
        observacoes: z.string().optional(),
        tipo: z.string().optional(),
      }))
      .mutation(({ input }) => db.createVisita(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        data: z.string().optional(),
        realizada: z.number().optional(),
        endereco: z.string().optional(),
        horario: z.string().optional(),
        observacoes: z.string().optional(),
        tipo: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateVisita(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteVisita(input.id)),
  }),

  atas: router({
    list: publicProcedure.query(() => db.getAllAtas()),
    create: protectedProcedure
      .input(z.object({
        data: z.string(),
        conteudo: z.string().optional(),
      }))
      .mutation(({ input }) => db.createAta(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.string().optional(),
        conteudo: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateAta(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteAta(input.id)),
  }),

  versinhos: router({
    list: publicProcedure.query(() => db.getAllVersinhos()),
    create: protectedProcedure
      .input(z.object({
        livro: z.string(),
        capitulo: z.number(),
        versiculo: z.number(),
        ordem: z.number(),
      }))
      .mutation(({ input }) => db.createVersinho(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        livro: z.string().optional(),
        capitulo: z.number().optional(),
        versiculo: z.number().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(({ input }) => db.updateVersinho(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteVersinho(input.id)),
  }),

  eventos: router({
    list: publicProcedure.query(() => db.getAllEventos()),
    create: protectedProcedure
      .input(z.object({
        data: z.string(),
        tipo: z.string(),
        titulo: z.string().optional(),
      }))
      .mutation(({ input }) => db.createEvento(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.string().optional(),
        tipo: z.string().optional(),
        titulo: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateEvento(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteEvento(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
