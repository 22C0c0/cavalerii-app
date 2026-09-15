import type { Doc } from "@/convex/_generated/dataModel";

/** Formatează o dată locală "YYYY-MM-DD" + "HH:MM" ca datetime ICS (fără Z — floating local time). */
function icsStamp(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  const [hh, mm] = time.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function icsLine(key: string, value: string): string {
  return `${key}:${value}`;
}

function foldLine(line: string): string {
  // RFC 5545: linii de max 75 octeți, continue cu spațiu
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  return parts.join("\r\n");
}

function buildICS(events: Array<{
  uid: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  time: string;
  endTime?: string;
}>): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ACS Cavalerii Suceava//Management Club//RO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    const start = icsStamp(ev.date, ev.time);
    const end = ev.endTime ? icsStamp(ev.date, ev.endTime) : undefined;
    // fără end explicit: durată implicită 2h pentru antrenamente / 4h pentru competiții
    const endFallback = (() => {
      const [y, m, d] = ev.date.split("-").map(Number);
      const [hh, mm] = ev.time.split(":").map(Number);
      const total = hh * 60 + mm + 120;
      const eh = Math.floor(total / 60) % 24;
      const em = total % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}T${pad(eh)}${pad(em)}00`;
    })();

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(icsLine("UID", ev.uid)));
    lines.push(foldLine(icsLine("DTSTAMP", `${icsStamp(ev.date, "00:00")}Z`)));
    lines.push(foldLine(icsLine("DTSTART", start)));
    lines.push(foldLine(icsLine("DTEND", end ?? endFallback)));
    lines.push(foldLine(icsLine("SUMMARY", icsEscape(ev.title))));
    if (ev.location) lines.push(foldLine(icsLine("LOCATION", icsEscape(ev.location))));
    if (ev.description) {
      lines.push(foldLine(icsLine("DESCRIPTION", icsEscape(ev.description))));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Descarcă un fișier .ics cu evenimentele date. */
export function downloadICS(
  filename: string,
  events: Array<{
    uid: string;
    title: string;
    description?: string;
    location?: string;
    date: string;
    time: string;
    endTime?: string;
  }>,
): void {
  const ics = buildICS(events);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type CalendarTraining = Doc<"trainings">;
export type CalendarEvent = Doc<"events">;

/** Antrenament → eveniment ICS */
export function trainingToICS(t: Doc<"trainings">) {
  return {
    uid: `training-${t._id}@cavalerii-suceava`,
    title: `Antrenament${t.group ? ` ${t.group}` : ""} — ACS Cavalerii Suceava`,
    description: t.notes ?? undefined,
    location: t.location,
    date: t.date,
    time: t.time,
  };
}

/** Competiție/eveniment → eveniment ICS */
export function eventToICS(e: Doc<"events">) {
  return {
    uid: `event-${e._id}@cavalerii-suceava`,
    title: `${e.type === "competition" ? "Competiție" : "Eveniment"}: ${e.title}`,
    description: e.description ?? undefined,
    location: e.location,
    date: e.date,
    time: e.time ?? "09:00",
  };
}
