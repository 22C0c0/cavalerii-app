import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  formatDateRO,
  formatDayName,
  formatLongDateRO,
  isStaff,
  todayISO,
} from "@/lib/club";
import {
  CalendarCheck,
  Check,
  CircleSlash,
  Clock,
  Loader2,
  MailQuestion,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_META = {
  present: { label: "Prezent", icon: Check, cls: "bg-emerald-500/15 text-emerald-500" },
  absent: { label: "Absent", icon: X, cls: "text-destructive bg-destructive/10" },
  excused: { label: "Motivat", icon: CircleSlash, cls: "bg-gold/15 text-gold" },
} as const;

type Status = keyof typeof STATUS_META;

export default function Attendance() {
  const { user } = useAuth();
  const staff = isStaff(user?.clubRole);

  return (
    <AppShell>
      <PageHeader
        title="Prezență"
        subtitle={
          staff
            ? "Marchează prezența sportivilor la fiecare antrenament."
            : "Istoricul tău de prezență la antrenamente."
        }
      />
      {staff ? <CoachAttendance /> : <MemberAttendance />}
    </AppShell>
  );
}

/* ---------------- coach view ---------------- */

function CoachAttendance() {
  const trainings = useQuery(api.club.listTrainings);
  const today = todayISO();
  const past = (trainings ?? [])
    .filter((t) => t.date < today)
    .slice()
    .reverse()
    .slice(0, 12);

  if (trainings === undefined) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (past.length === 0) {
    return (
      <Card className="club-card border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <CalendarCheck className="size-8 text-muted-foreground" />
          <p className="font-medium">Nicio săptămână trecută de marcat</p>
          <p className="text-sm text-muted-foreground">
            Prezența se marchează pentru antrenamentele care au avut loc.
          </p>
        </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {past.map((t) => (
        <TrainingAttendanceRow key={t._id} training={t} />
      ))}
    </div>
  );
}

function TrainingAttendanceRow({ training }: { training: Doc<"trainings"> }) {
  const [open, setOpen] = useState(false);
  const attendance = useQuery(api.features.getAttendanceForTraining, {
    trainingId: training._id,
  });

  const present = (attendance ?? []).filter((a) => a.status === "present").length;
  const total = attendance?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Card className="club-card club-card-hover cursor-pointer">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-secondary px-2 py-3">
              <span className="text-xl font-bold leading-none">
                {training.date.slice(8, 10)}
              </span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDateRO(training.date).split(" ")[1]?.slice(0, 3)}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">
                {formatDayName(training.date)} · {training.time}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {training.location}
              </p>
            </div>
            <Badge variant="secondary">
              <Users className="mr-1 size-3" />
              {present}/{total || "—"} prezenți
            </Badge>
          </CardContent>
        </Card>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Prezență — {formatDayName(training.date)}</SheetTitle>
          <SheetDescription>
            {formatLongDateRO(training.date)} · {training.time} ·{" "}
            {training.location}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-8">
          <AthleteMarkList trainingId={training._id} attendance={attendance} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AthleteMarkList({
  trainingId,
  attendance,
}: {
  trainingId: Id<"trainings">;
  attendance: Doc<"attendance">[] | undefined;
}) {
  const athletes = useQuery(api.club.listAthletes);
  const setAttendance = useMutation(api.features.setAttendance);
  const [pending, setPending] = useState<string | null>(null);

  if (athletes === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (athletes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Niciun sportiv înregistrat în club încă.
      </p>
    );
  }

  const handle = async (athleteId: Id<"users">, status: Status) => {
    setPending(athleteId);
    try {
      await setAttendance({ trainingId, athleteId, status });
      toast.success("Prezență salvată.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la salvare.");
    } finally {
      setPending(null);
    }
  };

  return (
    <ul className="flex flex-col gap-3">
      {athletes.map((a) => {
        const current = attendance?.find((r) => r.athleteId === a._id)?.status;
        return (
          <li key={a._id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{a.name}</p>
                {a.ageGroup && (
                  <p className="text-xs text-muted-foreground">{a.ageGroup}</p>
                )}
              </div>
              {pending === a._id && <Loader2 className="size-4 animate-spin" />}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_META) as Status[]).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                const active = current === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handle(a._id, s)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                      active
                        ? `${meta.cls} border-transparent`
                        : "border-border text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    <Icon className="size-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- member view ---------------- */

function MemberAttendance() {
  const attendance = useQuery(api.features.myAttendance);
  const trainings = useQuery(api.club.listTrainings);

  if (attendance === undefined || trainings === undefined) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = attendance
    .map((a) => ({
      ...a,
      training: trainings.find((t) => t._id === a.trainingId),
    }))
    .filter((r) => r.training)
    .sort((a, b) =>
      `${b.training!.date} ${b.training!.time}`.localeCompare(
        `${a.training!.date} ${a.training!.time}`,
      ),
    );

  const total = rows.length;
  const presentCount = rows.filter((r) => r.status === "present").length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : null;

  if (total === 0) {
    return (
      <Card className="club-card border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <MailQuestion className="size-8 text-muted-foreground" />
          <p className="font-medium">Prezența n-a fost înregistrată încă</p>
          <p className="text-sm text-muted-foreground">
            Antrenorul marchează prezența după fiecare antrenament și istoricul
            apare aici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Prezent" value={presentCount} tone="ok" />
        <MiniStat
          label="Motivat"
          value={rows.filter((r) => r.status === "excused").length}
          tone="gold"
        />
        <MiniStat
          label="Absent"
          value={rows.filter((r) => r.status === "absent").length}
          tone="bad"
        />
      </div>
      {rate !== null && (
        <Card className="club-card">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <CalendarCheck className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none">{rate}% prezență</p>
              <p className="mt-1 text-sm text-muted-foreground">
                din antrenamentele la care ai fost înregistrat(ă)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      <ul className="flex flex-col gap-2">
        {rows.map((r) => {
          const meta = STATUS_META[r.status];
          const Icon = meta.icon;
          return (
            <li
              key={r._id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.cls)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">
                  {formatDayName(r.training!.date)}, {formatDateRO(r.training!.date)} ·{" "}
                  {r.training!.time}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.training!.location}
                </p>
              </div>
              <Clock className="size-4 shrink-0 text-muted-foreground" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "gold" | "bad";
}) {
  const tones = {
    ok: "bg-emerald-500/15 text-emerald-500",
    gold: "bg-gold/15 text-gold",
    bad: "bg-destructive/10 text-destructive",
  };
  return (
    <div className={cn("rounded-xl p-4 text-center", tones[tone])}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}
