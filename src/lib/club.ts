import { CLUB_ROLES, type ClubRole } from "@/convex/schema";

export const CLUB_NAME = "ACS Cavalerii Suceava";

// Deep link către WhatsApp-ul antrenorului.
// Numărul e integrat în aplicație dar NU în clar (protecție împotriva
// colectării automate de către roboți — apare doar ca ghilimele de coduri ASCII).
// Opțional, poate fi suprascris cu variabila de mediu VITE_COACH_PHONE.
const BAKED_PHONE = String.fromCharCode(52, 48, 55, 53, 53, 50, 56, 55, 53, 54, 50); // +40 755 287 562

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `40${digits.slice(1)}`; // format local românesc → internațional
  }
  return digits;
}

const normalizedPhone = (() => {
  const fromEnv = normalizePhone(String(import.meta.env.VITE_COACH_PHONE ?? ""));
  return fromEnv || BAKED_PHONE;
})();

export const COACH_PHONE: string | undefined = normalizedPhone || undefined;

/** true dacă numărul antrenorului e configurat — butoanele WhatsApp se afișează doar atunci. */
export const coachPhoneConfigured = /^\d{8,15}$/.test(normalizedPhone);

export const coachWhatsAppUrl = (prefill?: string) =>
  coachPhoneConfigured && COACH_PHONE
    ? `https://wa.me/${COACH_PHONE}${
        prefill ? `?text=${encodeURIComponent(prefill)}` : ""
      }`
    : "";

export const TRAINING_LOCATIONS = [
  "Horodnic de Sus",
  'Școala Generală nr. 11 "Miron Costin" Suceava',
] as const;

export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];

export const AGE_GROUPS = ["U8", "U10", "U12", "U14", "U16", "U18"] as const;

export const ROLE_LABELS: Record<ClubRole | "none", string> = {
  coach: "Antrenor",
  athlete: "Sportiv",
  parent: "Părinte",
  admin: "Administrator",
  none: "Fără rol",
};

export const ROLE_DESCRIPTIONS: Record<ClubRole | "none", string> = {
  coach: "Programează antrenamente, publică competiții și menține legătura cu echipa.",
  athlete: "Vezi programul antrenamentelor tale și competițiile la care participi.",
  parent: "Urmărește programul copilului, competițiile și contactează rapid antrenorul.",
  admin: "Acces complet la gestionarea clubului.",
  none: "Alege rolul tău în club.",
};

export const isStaff = (role: string | null | undefined) =>
  role === CLUB_ROLES.COACH || role === CLUB_ROLES.ADMIN;

// ---------- date helpers (fără dependențe de timezone) ----------

const WEEKDAYS_RO = [
  "Duminică",
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
];
const MONTHS_RO = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

export function parseISODate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDayName(date: string): string {
  return WEEKDAYS_RO[parseISODate(date).getDay()];
}

export function formatDateRO(date: string, withYear = false): string {
  const d = parseISODate(date);
  const base = `${d.getDate()} ${MONTHS_RO[d.getMonth()]}`;
  return withYear ? `${base} ${d.getFullYear()}` : base;
}

export function formatLongDateRO(date: string): string {
  const d = parseISODate(date);
  return `${WEEKDAYS_RO[d.getDay()]}, ${d.getDate()} ${MONTHS_RO[d.getMonth()]}${d.getFullYear() ? ` ${d.getFullYear()}` : ""}`;
}

export function daysUntil(date: string): number {
  const target = parseISODate(date).getTime();
  const today = parseISODate(todayISO()).getTime();
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

export function relativeDaysRO(date: string): string {
  const diff = daysUntil(date);
  if (diff === 0) return "Astăzi";
  if (diff === 1) return "Mâine";
  if (diff < 0) return `Acum ${Math.abs(diff)} zile`;
  if (diff < 7) return `În ${diff} zile`;
  return formatDateRO(date);
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
