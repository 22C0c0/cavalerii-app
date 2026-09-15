import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import {
  CLUB_ROLES,
  clubRoleValidator,
  LOCATIONS,
  locationValidator,
} from "./schema";

// ---------- helpers ----------

export async function requireUser(ctx: QueryCtx) {
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
  if (
    user.clubRole !== CLUB_ROLES.COACH &&
    user.clubRole !== CLUB_ROLES.ADMIN
  ) {
    throw new Error(
      "Acces permis doar antrenorului sau administratorului clubului.",
    );
  }
  return user;
}

function todayISO() {
  // Romania is UTC+2/+3; approximating with Europe/Bucharest date is good enough here
  const now = new Date();
  const bucharest = new Date(
    now.getTime() + 2.5 * 60 * 60 * 1000,
  ); // shift toward Bucharest
  return bucharest.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" + n days -> "YYYY-MM-DD" (UTC math, DST-safe). */
function addDaysISO(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// ---------- profile / onboarding ----------

export const completeProfile = mutation({
  args: {
    name: v.string(),
    clubRole: clubRoleValidator,
    phone: v.optional(v.string()),
    athleteId: v.optional(v.id("users")),
    athleteName: v.optional(v.string()),
    ageGroup: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const patch: Record<string, unknown> = {
      name: args.name.trim(),
      clubRole: args.clubRole,
      phone: args.phone?.trim() || undefined,
      profileComplete: true,
    };

    if (args.clubRole === CLUB_ROLES.PARENT && args.athleteId) {
      const athlete = await ctx.db.get(args.athleteId);
      if (!athlete || athlete.clubRole !== CLUB_ROLES.ATHLETE) {
        throw new Error("Sportivul selectat nu a fost găsit.");
      }
      patch.athleteId = args.athleteId;
    }

    if (args.clubRole === CLUB_ROLES.ATHLETE) {
      patch.ageGroup = args.ageGroup?.trim() || "U12";
    }

    await ctx.db.patch(user._id, patch);

    // optionally rename the linked athlete (useful when coach hasn't set it yet)
    if (
      args.clubRole === CLUB_ROLES.PARENT &&
      args.athleteId &&
      args.athleteName?.trim()
    ) {
      await ctx.db.patch(args.athleteId, { name: args.athleteName.trim() });
    }

    return { ok: true };
  },
});

export const listAthletes = query({
  args: {},
  handler: async (ctx) => {
    const athletes = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clubRole"), CLUB_ROLES.ATHLETE))
      .collect();
    return athletes
      .map((a) => ({ _id: a._id, name: a.name ?? "", ageGroup: a.ageGroup }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },
});

// ---------- trainings ----------

export const listTrainings = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const trainings = await ctx.db.query("trainings").collect();
    return trainings.sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    );
  },
});

export const addTraining = mutation({
  args: {
    date: v.string(),
    time: v.string(),
    location: locationValidator,
    group: v.optional(v.string()),
    notes: v.optional(v.string()),
    // recurență: "none" = o singură dată, "weekly" = în fiecare săptămână, aceeași zi
    repeat: v.optional(v.union(v.literal("none"), v.literal("weekly"))),
    // pentru repeat weekly: pe câte săptămâni se generează (2–26)
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const base = {
      time: args.time,
      location: args.location,
      group: args.group?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      createdBy: staff._id,
    };

    if (args.repeat === "weekly") {
      const weeks = Math.min(Math.max(args.weeks ?? 4, 2), 26);
      // prima apariție devine rădăcina seriei (seriesId = propriul id)
      const firstId = await ctx.db.insert("trainings", {
        ...base,
        date: args.date,
      });
      await ctx.db.patch(firstId, { seriesId: firstId });
      for (let i = 1; i < weeks; i++) {
        await ctx.db.insert("trainings", {
          ...base,
          date: addDaysISO(args.date, i * 7),
          seriesId: firstId,
        });
      }
      return firstId;
    }

    await ctx.db.insert("trainings", { ...base, date: args.date });
  },
});

export const deleteTraining = mutation({
  args: { id: v.id("trainings") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    await ctx.db.delete(args.id);
  },
});

/** Șterge toată seria săptămânală căreia îi aparține antrenamentul dat. */
export const deleteTrainingSeries = mutation({
  args: { id: v.id("trainings") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const training = await ctx.db.get(args.id);
    if (training === null) return;

    const seriesId = training.seriesId ?? training._id;
    const occurrences = await ctx.db
      .query("trainings")
      .filter((q) => q.eq(q.field("seriesId"), seriesId))
      .collect();

    if (occurrences.length === 0) {
      // antrenament singular (fără serie)
      await ctx.db.delete(args.id);
      return;
    }
    for (const t of occurrences) {
      await ctx.db.delete(t._id);
    }
  },
});

// ---------- events ----------

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const events = await ctx.db.query("events").collect();
    return events.sort((a, b) =>
      `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`),
    );
  },
});

export const addEvent = mutation({
  args: {
    type: v.union(v.literal("competition"), v.literal("event")),
    date: v.string(),
    time: v.optional(v.string()),
    location: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const id = await ctx.db.insert("events", {
      ...args,
      time: args.time?.trim() || undefined,
      description: args.description?.trim() || undefined,
      createdBy: staff._id,
    });
    return id;
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    await ctx.db.delete(args.id);
  },
});

// ---------- dashboard ----------

export const dashboardData = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const today = todayISO();

    const trainings = await ctx.db.query("trainings").collect();
    const events = await ctx.db.query("events").collect();

    const upcomingTrainings = trainings
      .filter((t) => t.date >= today)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    const upcomingEvents = events
      .filter((e) => e.date >= today)
      .sort((a, b) =>
        `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`),
      );

    const nextTraining = upcomingTrainings[0] ?? null;
    const nextCompetition =
      upcomingEvents.find((e) => e.type === "competition") ?? null;

    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    return {
      role: user.clubRole ?? null,
      name: user.name ?? null,
      nextTraining,
      nextCompetition,
      upcomingTrainingsCount: upcomingTrainings.length,
      upcomingEventsCount: upcomingEvents.length,
      trainingsThisWeek: upcomingTrainings.filter(
        (t) => t.date <= weekFromNow,
      ).length,
      allUpcomingTrainings: upcomingTrainings.slice(0, 6),
      allUpcomingEvents: upcomingEvents.slice(0, 6),
    };
  },
});

// ---------- demo seed (staff only) ----------

function shiftDate(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);

    const trainings = await ctx.db.query("trainings").collect();
    const events = await ctx.db.query("events").collect();
    if (trainings.length > 0 || events.length > 0) {
      return { skipped: true as const };
    }

    const now = new Date();
    // next Monday
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + ((8 - day) % 7 || 7));

    const schedule: Array<{
      dayOffset: number;
      time: string;
      location: (typeof LOCATIONS)[number];
      group: string;
    }> = [
      { dayOffset: 0, time: "18:00", location: "Horodnic de Sus", group: "U12" },
      { dayOffset: 1, time: "19:30", location: "Școala Generală nr. 11 \"Miron Costin\" Suceava", group: "U14" },
      { dayOffset: 3, time: "18:00", location: "Horodnic de Sus", group: "U12" },
      { dayOffset: 4, time: "19:00", location: "Școala Generală nr. 11 \"Miron Costin\" Suceava", group: "U14" },
    ];

    for (let week = 0; week < 3; week++) {
      for (const s of schedule) {
        await ctx.db.insert("trainings", {
          date: shiftDate(monday, s.dayOffset + week * 7),
          time: s.time,
          location: s.location,
          group: s.group,
          notes: undefined,
        });
      }
    }

    await ctx.db.insert("events", {
      type: "competition",
      date: shiftDate(now, 12),
      time: "10:00",
      location: "Sala Polivalentă, Suceava",
      title: "Etapa Regională U14 — Suceava",
      description:
        "Convocare cu o oră înainte de start. Tricouri albastre, aviz medical valabil.",
    });
    await ctx.db.insert("events", {
      type: "event",
      date: shiftDate(now, 20),
      time: "17:00",
      location: "Sala sportive, Horodnic de Sus",
      title: "Meci amical vs CSS Suceava",
      description: "Meci de pregătire, disputat pe sala din Horodnic de Sus.",
    });
    await ctx.db.insert("events", {
      type: "event",
      date: shiftDate(now, 35),
      time: "16:00",
      location: "Complex sportiv, Suceava",
      title: "Tur de club și fotografia oficială",
      description: "Toate grupele, echipament complet.",
    });

    return { seeded: true as const };
  },
});
