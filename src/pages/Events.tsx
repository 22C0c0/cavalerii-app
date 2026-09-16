import { AddToCalendarAllButton, AddToCalendarButton } from "@/components/AddToCalendar";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  coachPhoneConfigured,
  coachWhatsAppUrl,
  formatDateRO,
  formatLongDateRO,
  isStaff,
  relativeDaysRO,
  todayISO,
} from "@/lib/club";
import {
  CalendarDays,
  Clock,
  Info,
  Loader2,
  MapPin,
  Medal,
  MessageCircle,
  PartyPopper,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Events() {
  const { user } = useAuth();
  const events = useQuery(api.club.listEvents);
  const addEvent = useMutation(api.club.addEvent);
  const deleteEvent = useMutation(api.club.deleteEvent);

  const staff = isStaff(user?.clubRole);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [type, setType] = useState<"competition" | "event">("competition");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const filtered = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (e) => typeFilter === "all" || (typeFilter === "competition" ? e.type === "competition" : e.type === "event"),
    );
  }, [events, typeFilter]);

  const today = todayISO();
  const upcoming = filtered.filter((e) => e.date >= today);
  const past = filtered.filter((e) => e.date < today).slice().reverse();

  const handleAdd = async () => {
    if (!title.trim() || !date) {
      toast.error("Completează titlul și data.");
      return;
    }
    setSaving(true);
    try {
      await addEvent({
        type,
        title: title.trim(),
        date,
        time: time.trim() || undefined,
        location: location.trim(),
        description: description.trim() || undefined,
      });
      toast.success(
        type === "competition"
          ? "Competiție adăugată în calendar."
          : "Eveniment adăugat în calendar.",
      );
      setOpen(false);
      setTitle("");
      setLocation("");
      setDescription("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Doc<"events">["_id"]) => {
    try {
      await deleteEvent({ id });
      toast.success("Intrare ștearsă din calendar.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Competiții & evenimente"
        subtitle="Calendarul complet al clubului — vizibil pentru sportivi și părinți."
        action={
          staff ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Adaugă în calendar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Competiție sau eveniment</DialogTitle>
                  <DialogDescription>
                    Toți membrii clubului văd intrarea imediat după salvare.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Tip</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <TypeOption
                        active={type === "competition"}
                        onClick={() => setType("competition")}
                        icon={Trophy}
                        label="Competiție"
                      />
                      <TypeOption
                        active={type === "event"}
                        onClick={() => setType("event")}
                        icon={PartyPopper}
                        label="Eveniment"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ev-title">Titlu</Label>
                    <Input
                      id="ev-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ex. Etapa Regională U14"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ev-date">Data</Label>
                      <Input
                        id="ev-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ev-time">Ora (opțional)</Label>
                      <Input
                        id="ev-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ev-location">Locația</Label>
                    <Input
                      id="ev-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="ex. Sala Polivalentă, Suceava"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ev-desc">
                      Descriere{" "}
                      <span className="text-muted-foreground">(opțional)</span>
                    </Label>
                    <Textarea
                      id="ev-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ex. Convocare cu o oră înainte, tricouri albastre"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Anulează
                  </Button>
                  <Button onClick={handleAdd} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Salvează
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : coachPhoneConfigured ? (
            <a
              href={coachWhatsAppUrl(
                "Bună ziua! Am o întrebare despre competiții și evenimente.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <MessageCircle className="size-4" />
                Întreabă antrenorul
              </Button>
            </a>
          ) : null
        }
      />

      {/* Type filter + export */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          label="Toate"
        />
        <FilterChip
          active={typeFilter === "competition"}
          onClick={() => setTypeFilter("competition")}
          label="Competiții"
        />
        <FilterChip
          active={typeFilter === "event"}
          onClick={() => setTypeFilter("event")}
          label="Evenimente"
        />
        {upcoming.length > 0 && (
          <span className="ml-auto">
            <AddToCalendarAllButton kind="event" items={upcoming} />
          </span>
        )}
      </div>

      {events === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <EventSection
            title="Urmează"
            icon={CalendarDays}
            items={upcoming}
            staff={staff}
            onDelete={handleDelete}
          />
          {past.length > 0 && (
            <EventSection
              title="Trecute"
              icon={Clock}
              items={past}
              staff={staff}
              onDelete={handleDelete}
              muted
            />
          )}
          {filtered.length === 0 && (
            <Card className="club-card border-dashed">
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                <Trophy className="size-8 text-muted-foreground" />
                <p className="font-medium">Calendar liber</p>
                <p className="text-sm text-muted-foreground">
                  {typeFilter === "all"
                    ? "Nicio competiție sau eveniment anunțat momentan."
                    : typeFilter === "competition"
                      ? "Nicio competiție anunțată momentan."
                      : "Niciun eveniment anunțat momentan."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}

/* ---------- pieces ---------- */

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-gold/60 bg-gold text-gold-foreground"
          : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function TypeOption({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Trophy;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-gold bg-gold/10 text-gold-foreground ring-1 ring-gold/40"
          : "border-border bg-card text-muted-foreground hover:bg-accent/50"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function EventSection({
  title,
  icon: Icon,
  items,
  staff,
  onDelete,
  muted,
}: {
  title: string;
  icon: typeof CalendarDays;
  items: Doc<"events">[];
  staff: boolean;
  onDelete: (id: Doc<"events">["_id"]) => void;
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4" />
        {title}
        <span className="font-normal normal-case tracking-normal">
          ({items.length})
      </span>
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((e) => (
          <Card
            key={e._id}
            className={`club-card group relative overflow-hidden ${muted ? "opacity-90" : ""}`}
          >
            {staff && (
              <button
                type="button"
                onClick={() => onDelete(e._id)}
                aria-label="Șterge intrarea"
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-60 md:group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span
                className={`flex w-16 shrink-0 flex-col items-center rounded-xl px-2 py-3 ${
                  e.type === "competition"
                    ? "bg-bordo/20"
                    : "bg-gold/15"
                }`}
              >
                <span
                  className={`text-xl font-bold leading-none ${
                    e.type === "competition" ? "text-bordo" : "text-gold"
                  }`}
                >
                  {e.date.slice(8, 10)}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatDateRO(e.date).split(" ")[1]?.slice(0, 3)}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      e.type === "competition"
                        ? "bg-bordo text-bordo-foreground"
                        : "bg-gold text-gold-foreground"
                    }
                  >
                    {e.type === "competition" ? (
                      <>
                        <Trophy className="mr-1 size-3" />
                        Competiție
                      </>
                    ) : (
                      <>
                        <PartyPopper className="mr-1 size-3" />
                        Eveniment
                      </>
                    )}
                  </Badge>
                  <Badge variant="secondary">{relativeDaysRO(e.date)}</Badge>
                </div>
                <p className="mt-2 font-semibold">{e.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {e.location}
                  </span>
                  {e.time && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0" />
                      {e.time}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {e.description}
                  </p>
                )}
                <div className="mt-3">
                  <AddToCalendarButton kind="event" item={e} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
