import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { CLUB_ROLES } from "./schema";

// ---------- helpers ----------

async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Neautentificat. Conectează-te pentru a continua.");
  }
  const user = await ctx.db.get(userId);
  if (user === null) {
    throw new Error("Utilizator inexistent.");
  }
  return user;
}

async function requireStaff(ctx: QueryCtx) {
  const user = await requireUser(ctx);
  if (user.clubRole !== CLUB_ROLES.COACH && user.clubRole !== CLUB_ROLES.ADMIN) {
    throw new Error("Acces permis doar antrenorului sau administratorului.");
  }
  return user;
}

function currentMonth(): string {
  const now = new Date();
  const bucharest = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
  return bucharest.toISOString().slice(0, 7); // "YYYY-MM"
}

function todayISO(): string {
  const now = new Date();
  const bucharest = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
  return bucharest.toISOString().slice(0, 10);
}

// ---------- anunțuri ----------

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const items = await ctx.db.query("announcements").collect();
    return items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const addAnnouncement = mutation({
  args: { title: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const id = await ctx.db.insert("announcements", {
      title: args.title.trim(),
      body: args.body.trim(),
      createdBy: staff._id,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    await ctx.db.delete(args.id);
  },
});

// ---------- prezență ----------

export const getAttendanceForTraining = query({
  args: { trainingId: v.id("trainings") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_training", (q) => q.eq("trainingId", args.trainingId))
      .collect();
    return rows;
  },
});

// prezența mea (sportiv) sau a copilului (părinte), cu istoric
export const myAttendance = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    let target = user;
    if (user.clubRole === CLUB_ROLES.PARENT && user.athleteId) {
      const athlete = await ctx.db.get(user.athleteId);
      if (athlete) target = athlete;
    }
    if (target.clubRole !== CLUB_ROLES.ATHLETE) return [];
    return await ctx.db
      .query("attendance")
      .withIndex("by_athlete", (q) => q.eq("athleteId", target._id))
      .collect();
  },
});

export const setAttendance = mutation({
  args: {
    trainingId: v.id("trainings"),
    athleteId: v.id("users"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("excused"),
    ),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const athlete = await ctx.db.get(args.athleteId);
    if (!athlete || athlete.clubRole !== CLUB_ROLES.ATHLETE) {
      throw new Error("Sportivul nu a fost găsit.");
    }
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_training", (q) => q.eq("trainingId", args.trainingId))
      .collect();
    const row = existing.find((r) => r.athleteId === args.athleteId);
    if (row) {
      await ctx.db.patch(row._id, { status: args.status, markedBy: staff._id });
    } else {
      await ctx.db.insert("attendance", {
        trainingId: args.trainingId,
        athleteId: args.athleteId,
        status: args.status,
        markedBy: staff._id,
      });
    }
    return { ok: true as const };
  },
});

// ---------- cotizații ----------

export const myPaymentSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    let target = user;
    if (user.clubRole === CLUB_ROLES.PARENT && user.athleteId) {
      const athlete = await ctx.db.get(user.athleteId);
      if (athlete) target = athlete;
    }
    if (target.clubRole !== CLUB_ROLES.ATHLETE) return null;

    const month = currentMonth();
    const all = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .collect();
    const current = all.find((p) => p.month === month) ?? null;
    const history = all.sort((a, b) => b.month.localeCompare(a.month));

    return {
      athleteName: target.name ?? "Sportiv",
      month,
      currentStatus: current?.status ?? "unpaid",
      currentAmount: current?.amount ?? null,
      history,
    };
  },
});

export const paymentsOverview = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const month = args.month ?? currentMonth();
    const athletes = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clubRole"), CLUB_ROLES.ATHLETE))
      .collect();

    const rows = await Promise.all(
      athletes
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
        .map(async (a) => {
          const existing = await ctx.db
            .query("payments")
            .withIndex("by_user", (q) => q.eq("userId", a._id))
            .collect();
          const current = existing.find((p) => p.month === month) ?? null;
          return {
            athleteId: a._id,
            athleteName: a.name ?? "Sportiv",
            ageGroup: a.ageGroup ?? null,
            paymentId: current?._id ?? null,
            status: current?.status ?? "unpaid",
            amount: current?.amount ?? null,
            paidAt: current?.paidAt ?? null,
          };
        }),
    );
    return { month, rows };
  },
});

export const setPaymentStatus = mutation({
  args: {
    userId: v.id("users"),
    month: v.string(),
    status: v.union(v.literal("paid"), v.literal("unpaid")),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const athlete = await ctx.db.get(args.userId);
    if (!athlete || athlete.clubRole !== CLUB_ROLES.ATHLETE) {
      throw new Error("Sportivul nu a fost găsit.");
    }
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const row = existing.find((p) => p.month === args.month);
    if (row) {
      await ctx.db.patch(row._id, {
        status: args.status,
        amount: args.amount ?? row.amount,
        paidAt: args.status === "paid" ? Date.now() : undefined,
        markedBy: staff._id,
      });
    } else {
      await ctx.db.insert("payments", {
        userId: args.userId,
        month: args.month,
        status: args.status,
        amount: args.amount,
        paidAt: args.status === "paid" ? Date.now() : undefined,
        markedBy: staff._id,
        createdAt: Date.now(),
      });
    }
    return { ok: true as const };
  },
});

// ---------- notificări in-app ----------

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const lastRead = user.lastReadNotificationsAt ?? 0;
    const today = todayISO();
    const month = currentMonth();

    const announcements = await ctx.db.query("announcements").collect();
    const trainings = await ctx.db.query("trainings").collect();
    const events = await ctx.db.query("events").collect();

    type Item = {
      key: string;
      kind: "announcement" | "training" | "event" | "payment";
      title: string;
      body: string;
      date: string | null;
      createdAt: number;
      unread: boolean;
    };

    const items: Item[] = [];

    for (const a of announcements) {
      items.push({
        key: `a-${a._id}`,
        kind: "announcement",
        title: a.title,
        body: a.body,
        date: null,
        createdAt: a.createdAt ?? 0,
        unread: (a.createdAt ?? 0) > lastRead,
      });
    }
    for (const t of trainings.filter((x) => x.date >= today)) {
      items.push({
        key: `t-${t._id}`,
        kind: "training",
        title: `Antrenament — ${t.date} ${t.time}`,
        body: `${t.location}${t.group ? ` · ${t.group}` : ""}`,
        date: t.date,
        createdAt: t.createdAt ?? 0,
        unread: (t.createdAt ?? 0) > lastRead,
      });
    }
    for (const e of events.filter((x) => x.date >= today)) {
      items.push({
        key: `e-${e._id}`,
        kind: "event",
        title: e.title,
        body: e.location,
        date: e.date,
        createdAt: e.createdAt ?? 0,
        unread: (e.createdAt ?? 0) > lastRead,
      });
    }

    // reminder cotizație pentru sportiv / părinte
    if (
      user.clubRole === CLUB_ROLES.ATHLETE ||
      user.clubRole === CLUB_ROLES.PARENT
    ) {
      let target = user;
      if (user.clubRole === CLUB_ROLES.PARENT && user.athleteId) {
        const athlete = await ctx.db.get(user.athleteId);
        if (athlete) target = athlete;
      }
      if (target.clubRole === CLUB_ROLES.ATHLETE) {
        const payments = await ctx.db
          .query("payments")
          .withIndex("by_user", (q) => q.eq("userId", target._id))
          .collect();
        const current = payments.find((p) => p.month === month);
        const isUnpaid = current ? current.status === "unpaid" : true;
        if (isUnpaid) {
          items.push({
            key: `p-${month}`,
            kind: "payment",
            title: "Cotizația lunii în curs",
            body: "Cotizația pentru această lună nu este marcată ca achitată.",
            date: null,
            createdAt: 0,
            unread: false,
          });
        }
      }
    }

    items.sort((a, b) => b.createdAt - a.createdAt);
    const unreadCount = items.filter((i) => i.unread).length;

    return { items: items.slice(0, 30), unreadCount };
  },
});

export const markNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { ok: false as const };
    await ctx.db.patch(userId, { lastReadNotificationsAt: Date.now() });
    return { ok: true as const };
  },
});
