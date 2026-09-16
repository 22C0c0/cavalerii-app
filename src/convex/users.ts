import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  CLUB_ROLES,
  isStaffEmail,
  STAFF_ADMIN_EMAIL,
  clubRoleValidator,
} from "./schema";
import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

/** Calculează rolul de club pentru un email de staff. */
export function staffRoleForEmail(email?: string | null) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (normalized === STAFF_ADMIN_EMAIL) return CLUB_ROLES.ADMIN;
  if (isStaffEmail(normalized)) return CLUB_ROLES.COACH;
  return null;
}

/**
 * Sincronizează rolul pentru un cont de staff (pe bază de email), dacă nu e
 * deja corect. Se apelează la completeProfile și la prima încărcare a shell-ului.
 */
export async function syncStaffRole(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !isStaffEmail(user.email)) return false;

  const correctRole = staffRoleForEmail(user.email);
  if (!correctRole) return false;

  const needsPatch =
    user.clubRole !== correctRole ||
    !user.profileComplete ||
    !user.name;

  if (!needsPatch) return false;

  await ctx.db.patch(userId, {
    clubRole: correctRole,
    profileComplete: true,
    ...(user.name ? {} : { name: "Staff" }),
  });
  return true;
}
/**
 * Sincronizează rolul contului curent dacă este un email de staff, fără alte
 * modificări. Returnează rolul efectiv după sincronizare.
 */
export const syncMyStaffRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { synced: false, clubRole: null };

    const changed = await syncStaffRole(ctx, userId);
    const user = await ctx.db.get(userId);
    return { synced: changed, clubRole: user?.clubRole ?? null };
  },
});

/**
 * Mutație pentru panoul de administrare de viitor: atribuire rol de către un
 * membru al staff-ului. Poate acorda DOAR roluri publice (sportiv/părinte),
 * indiferent de rolul celui care apelează — niciun cont nu poate crea alt
 * cont de staff, iar rolul de staff nu poate fi revocat accidental.
 */
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    clubRole: clubRoleValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Neautentificat. Conectează-te pentru a continua.");
    }

    const staff = await ctx.db.get(userId);
    if (
      !staff ||
      (staff.clubRole !== CLUB_ROLES.COACH &&
        staff.clubRole !== CLUB_ROLES.ADMIN)
    ) {
      throw new Error("Acces permis doar antrenorului sau administratorului.");
    }

    // Rolurile de staff nu se pot atribui prin aplicație — doar prin lista
    // STAFF_EMAILS din schema.ts (securitate: nimeni nu se poate auto-promova).
    if (
      args.clubRole === CLUB_ROLES.COACH ||
      args.clubRole === CLUB_ROLES.ADMIN
    ) {
      throw new Error(
        "Rolurile de staff se atribuie doar prin lista STAFF_EMAILS.",
      );
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Utilizatorul nu a fost găsit.");
    if (isStaffEmail(target.email)) {
      throw new Error("Conturile de staff au rolul fixat prin email.");
    }

    await ctx.db.patch(args.userId, { clubRole: args.clubRole });
    return { ok: true };
  },
});
