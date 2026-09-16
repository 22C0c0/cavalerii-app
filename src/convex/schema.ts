import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// ACS Cavalerii Suceava — club roles
export const CLUB_ROLES = {
  COACH: "coach",
  ATHLETE: "athlete",
  PARENT: "parent",
  ADMIN: "admin",
} as const;

export const clubRoleValidator = v.union(
  v.literal(CLUB_ROLES.COACH),
  v.literal(CLUB_ROLES.ATHLETE),
  v.literal(CLUB_ROLES.PARENT),
  v.literal(CLUB_ROLES.ADMIN),
);
export type ClubRole = Infer<typeof clubRoleValidator>;

// Rolurile de staff (antrenor, admin) NU se aleg la înregistrare — se atribuie
// automat după email. Primele emailuri din listă au prioritate.
export const STAFF_EMAILS = [
  "cosmovicicosminmarian@gmail.com", // admin / owner
  "antrenor@cavalieriisuceava.ro", // antrenor (placeholder — înlocuiește cu emailul real)
];

export const STAFF_ADMIN_EMAIL = STAFF_EMAILS[0];

export function isStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return STAFF_EMAILS.includes(normalized);
}

export const LOCATIONS = [
  "Horodnic de Sus",
  'Școala Generală nr. 11 "Miron Costin" Suceava',
] as const;
export const locationValidator = v.union(
  v.literal(LOCATIONS[0]),
  v.literal(LOCATIONS[1]),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // club fields
      clubRole: v.optional(clubRoleValidator),
      phone: v.optional(v.string()),
      // for parents: the athlete (users row) they are linked to
      athleteId: v.optional(v.id("users")),
      // for athletes: age group label, e.g. "U12"
      ageGroup: v.optional(v.string()),
      profileComplete: v.optional(v.boolean()),
      // timestamp of last time the user opened the notifications panel
      lastReadNotificationsAt: v.optional(v.number()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // antrenamente
    trainings: defineTable({
      date: v.string(), // "YYYY-MM-DD"
      time: v.string(), // "HH:MM"
      location: locationValidator,
      group: v.optional(v.string()), // age group, optional
      notes: v.optional(v.string()),
      createdBy: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
      // for recurring series: id of the first occurrence in the series
      seriesId: v.optional(v.id("trainings")),
    }).index("by_date", ["date"]),

    // anunțuri de la antrenor
    announcements: defineTable({
      title: v.string(),
      body: v.string(),
      createdBy: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
    }).index("by_created", ["createdAt"]),

    // prezență la antrenamente
    attendance: defineTable({
      trainingId: v.id("trainings"),
      athleteId: v.id("users"),
      status: v.union(
        v.literal("present"),
        v.literal("absent"),
        v.literal("excused")
      ),
      markedBy: v.optional(v.id("users")),
    })
      .index("by_training", ["trainingId"])
      .index("by_athlete", ["athleteId"]),

    // cotizații lunare
    payments: defineTable({
      userId: v.id("users"),
      month: v.string(), // "YYYY-MM"
      status: v.union(v.literal("paid"), v.literal("unpaid")),
      amount: v.optional(v.number()),
      paidAt: v.optional(v.number()),
      markedBy: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_month", ["month"]),

    // competiții și evenimente
    events: defineTable({
      type: v.union(v.literal("competition"), v.literal("event")),
      date: v.string(), // "YYYY-MM-DD"
      time: v.optional(v.string()), // "HH:MM"
      location: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      createdBy: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
    }).index("by_date", ["date"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
