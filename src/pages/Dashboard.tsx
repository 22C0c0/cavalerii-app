import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  ROLE_LABELS,
  coachWhatsAppUrl,
  formatDateRO,
  formatDayName,
  formatLongDateRO,
  isStaff,
  relativeDaysRO,
  todayISO,
} from "@/lib/club";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Megaphone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const seedDemo = useMutation(api.club.seedDemoData);
  const [seeding, setSeeding] = useState(false);

  const staff = isStaff(user?.clubRole);
  const firstName = user?.name?.split(" ")[0] ?? "";

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDemo({});
      if (res?.skipped) {
        toast.info("Există deja date în calendar.");
      } else {
        toast.success("Program demo adăugat: antrenamente și competiții.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={`Bună, ${firstName || "cavalerie"}!`}
        subtitle={formatLongDateRO(todayISO())}
        action={
          <Badge variant="outline" className="border-gold/50 font-semibold text-gold">
            {ROLE_LABELS[user?.clubRole ?? "none"]}
            {user?.clubRole === "athlete" && user?.ageGroup
              ? ` · ${user.ageGroup}`
              : ""}
          </Badge>
        }
      />

      {dashboard === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Feature cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <NextTrainingCard data={dashboard.nextTraining} />
            <NextCompetitionCard data={dashboard.nextCompetition} />
          </div>

          {/* Week stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={CalendarDays}
              value={dashboard.trainingsThisWeek}
              label="antrenamente în 7 zile"
            />
            <StatCard
              icon={Users}
              value={dashboard.upcomingTrainingsCount}
              label="antrenamente programate"
            />
            <StatCard
              icon={Trophy}
              value={dashboard.upcomingEventsCount}
              label="competiții & evenimente"
            />
          </div>

          {/* Empty state for staff */}
          {staff &&
            dashboard.upcomingTrainingsCount === 0 &&
            dashboard.upcomingEventsCount === 0 && (
              <Card className="club-card border-dashed">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Calendarul e gol</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Adaugă manual antrenamente sau încarcă un program demo
                      pentru a vedea aplicația în acțiune.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={handleSeed} disabled={seeding}>
                      {seeding ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Încarcă program demo
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/trainings">
                        <Plus className="size-4" />
                        Adaugă antrenament
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Latest announcement */}
          <LatestAnnouncement />

          {/* Upcoming lists */}
          <div className="grid gap-4 lg:grid-cols-2">
            <UpcomingTrainings
              items={dashboard.allUpcomingTrainings}
              totalCount={dashboard.upcomingTrainingsCount}
            />
            <UpcomingEvents
              items={dashboard.allUpcomingEvents}
              totalCount={dashboard.upcomingEventsCount}
            />
          </div>

          {/* Quick contact */}
          <Card className="club-card overflow-hidden">
            <CardContent className="flex flex-col items-start justify-between gap-4 border-gold/20 bg-gradient-to-r from-sidebar-accent to-sidebar p-6 text-sidebar-foreground sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">Ai o întrebare pentru antrenor?</p>
                <p className="mt-1 text-sm text-sidebar-foreground/90">
                  Scrie-i direct pe WhatsApp — răspuns de obicei în aceeași zi.
                </p>
              </div>
              <Button asChild>
                <a
                  href={coachWhatsAppUrl(
                    `Bună ziua! Sunt ${user?.name ?? "un membru"} din ${user?.clubRole === "parent" ? "părinții" : "clubul"} ACS Cavalerii Suceava.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Contact antrenor
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

/* ---------- data hook ---------- */

type Training = Doc<"trainings">;
type ClubEvent = Doc<"events">;

function useDashboard() {
  return useQuery(api.club.dashboardData);
}

/* ---------- latest announcement ---------- */

function LatestAnnouncement() {
  const announcements = useQuery(api.features.listAnnouncements);
  if (announcements === undefined) return null;
  const latest = announcements[0];
  if (!latest) return null;
  return (
    <Card className="club-card relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
      <CardContent className="flex items-start gap-4 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Anunț de la antrenor
          </p>
          <p className="mt-1 font-bold leading-snug">{latest.title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
            {latest.body}
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to="/announcements">
            Toate
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------- cards ---------- */

function NextTrainingCard({ data }: { data: Training | null }) {
  if (!data) {
    return (
      <Card className="club-card">
        <CardContent className="flex items-center gap-4 p-6">
          <IconTile icon={CalendarDays} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Următorul antrenament
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Nu există antrenamente programate încă.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="club-card club-card-hover relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Următorul antrenament
          </p>
          <Badge variant="secondary">{relativeDaysRO(data.date)}</Badge>
        </div>
        <div>
          <p className="text-lg font-bold">
            {formatDayName(data.date)}, {formatDateRO(data.date)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {data.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">
            {data.time}
          </Badge>
          {data.group && <Badge variant="outline">{data.group}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function NextCompetitionCard({ data }: { data: ClubEvent | null }) {
  if (!data) {
    return (
      <Card className="club-card">
        <CardContent className="flex items-center gap-4 p-6">
          <IconTile icon={Trophy} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Următoarea competiție
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Nicio competiție anunțată momentan.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="club-card club-card-hover relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-bordo" />
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-bordo">
            Următoarea competiție
          </p>
          <Badge variant="secondary">{relativeDaysRO(data.date)}</Badge>
        </div>
        <div>
          <p className="text-lg font-bold">{data.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {data.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-bordo text-bordo-foreground">
            {formatDateRO(data.date)}
            {data.time ? ` · ${data.time}` : ""}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function IconTile({ icon: Icon }: { icon: typeof CalendarDays }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-5" />
    </span>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof CalendarDays;
  value: number;
  label: string;
}) {
  return (
    <Card className="club-card">
      <CardContent className="flex items-center gap-3 p-4 sm:p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingTrainings({
  items,
  totalCount,
}: {
  items: Training[];
  totalCount: number;
}) {
  return (
    <Card className="club-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Următoarele antrenamente
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/trainings">
              Toate
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
        <Separator className="my-4" />
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Programul urmează să fie anunțat.
          </p>
        ) : (
          <ul className="flex flex-col">
            {items.slice(0, 4).map((t, i) => (
              <li key={t._id}>
                {i > 0 && <Separator className="my-1 opacity-60" />}
                <div className="flex items-center gap-3 py-2">
                  <span className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary px-2 py-1.5">
                    <span className="text-sm font-bold leading-none">
                      {t.date.slice(8, 10)}
                    </span>
                    <span className="mt-0.5 text-[11px] uppercase text-muted-foreground">
                      {formatDateRO(t.date).split(" ")[1]?.slice(0, 3)}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">
                      {formatDayName(t.date)} · {t.time}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {t.location}
                    </p>
                  </div>
                  {t.group && <Badge variant="outline">{t.group}</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {totalCount > 4 && (
          <Button variant="link" size="sm" className="mt-2 px-0" asChild>
            <Link to="/trainings">
              Vezi toate ({totalCount})
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingEvents({
  items,
  totalCount,
}: {
  items: ClubEvent[];
  totalCount: number;
}) {
  return (
    <Card className="club-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold">
            <Trophy className="size-4 text-bordo" />
            Competiții & evenimente
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events">
              Toate
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
        <Separator className="my-4" />
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Nicio competiție sau eveniment anunțat.
          </p>
        ) : (
          <ul className="flex flex-col">
            {items.slice(0, 4).map((e, i) => (
              <li key={e._id}>
                {i > 0 && <Separator className="my-1 opacity-60" />}
                <div className="flex items-center gap-3 py-2">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      e.type === "competition"
                        ? "bg-bordo/20 text-bordo"
                        : "bg-gold/15 text-gold"
                    }`}
                  >
                    <Trophy className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{e.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {formatLongDateRO(e.date)}
                      {e.time ? ` · ${e.time}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      e.type === "competition" ? "border-bordo/40 text-bordo" : ""
                    }
                  >
                    {e.type === "competition" ? "Competiție" : "Eveniment"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
        {totalCount > 4 && (
          <Button variant="link" size="sm" className="mt-2 px-0" asChild>
            <Link to="/events">
              Vezi toate ({totalCount})
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
