import { AddToCalendarAllButton, AddToCalendarButton } from "@/components/AddToCalendar";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  AGE_GROUPS,
  TRAINING_LOCATIONS,
  coachWhatsAppUrl,
  formatDateRO,
  formatDayName,
  formatLongDateRO,
  isStaff,
  todayISO,
} from "@/lib/club";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Trainings() {
  const { user } = useAuth();
  const trainings = useQuery(api.club.listTrainings);
  const addTraining = useMutation(api.club.addTraining);
  const deleteTraining = useMutation(api.club.deleteTraining);
  const deleteTrainingSeries = useMutation(api.club.deleteTrainingSeries);

  const staff = isStaff(user?.clubRole);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // delete-target being resolved (single vs. whole series)
  const [deleteTarget, setDeleteTarget] = useState<Doc<"trainings"> | null>(null);
  const [deleting, setDeleting] = useState(false);

  // form state
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState<string>(TRAINING_LOCATIONS[0]);
  const [group, setGroup] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [repeat, setRepeat] = useState<"none" | "weekly">("none");
  const [weeks, setWeeks] = useState("8");

  const filtered = useMemo(() => {
    if (!trainings) return [];
    return trainings.filter(
      (t) => locationFilter === "all" || t.location === locationFilter,
    );
  }, [trainings, locationFilter]);

  const today = todayISO();
  const upcoming = filtered.filter((t) => t.date >= today);
  const past = filtered.filter((t) => t.date < today).slice().reverse();

  const handleAdd = async () => {
    if (!date || !time) {
      toast.error("Completează data și ora antrenamentului.");
      return;
    }
    setSaving(true);
    try {
      await addTraining({
        date,
        time,
        location: location as (typeof TRAINING_LOCATIONS)[number],
        group: group === "none" ? undefined : group,
        notes: notes.trim() || undefined,
        repeat,
        weeks: repeat === "weekly" ? Number(weeks) || 8 : undefined,
      });
      toast.success(
        repeat === "weekly"
          ? `Program săptămânal creat: ${Number(weeks) || 8} antrenamente, în fiecare ${formatDayName(date).toLowerCase()}.`
          : "Antrenament adăugat în program.",
      );
      setOpen(false);
      setNotes("");
      setRepeat("none");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isSeries = (t: Doc<"trainings">) => Boolean(t.seriesId);

  const requestDelete = (t: Doc<"trainings">) => {
    if (isSeries(t)) {
      setDeleteTarget(t);
    } else {
      void handleDeleteSingle(t._id);
    }
  };

  const handleDeleteSingle = async (id: Doc<"trainings">["_id"]) => {
    try {
      await deleteTraining({ id });
      toast.success("Antrenament șters.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    }
  };

  const handleDeleteSeries = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTrainingSeries({ id: deleteTarget._id });
      toast.success("Toată seria săptămânală a fost ștearsă.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Antrenamente"
        subtitle="Program complet, filtrabil după locație."
        action={
          staff ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Antrenament nou
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Antrenament nou</DialogTitle>
                  <DialogDescription>
                    Programul apare instantaneu pentru sportivi și părinți.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tr-date">Data</Label>
                      <Input
                        id="tr-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tr-time">Ora</Label>
                      <Input
                        id="tr-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Locația</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRAINING_LOCATIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Grupa de vârstă</Label>
                    <Select value={group} onValueChange={setGroup}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Toate grupele" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Toate grupele</SelectItem>
                        {AGE_GROUPS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recurență */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-3">
                    <Label>Se repetă</Label>
                    <Select
                      value={repeat}
                      onValueChange={(v) => setRepeat(v as "none" | "weekly")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">O singură dată</SelectItem>
                        <SelectItem value="weekly">
                          Săptămânal (aceeași zi)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {repeat === "weekly" && (
                      <div className="mt-1 flex flex-col gap-2">
                        <Label htmlFor="tr-weeks">
                          Pe câte săptămâni{" "}
                          <span className="text-muted-foreground">(2–26)</span>
                        </Label>
                        <Input
                          id="tr-weeks"
                          type="number"
                          min={2}
                          max={26}
                          value={weeks}
                          onChange={(e) => setWeeks(e.target.value)}
                        />
                        <p className="text-xs leading-snug text-muted-foreground">
                          Se creează {Number(weeks) || 8} antrenamente, în
                          fiecare {formatDayName(date).toLowerCase()}, la aceeași
                          oră și locație. Le poți șterge individual sau pe
                          întreagă serie.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tr-notes">
                      Note{" "}
                      <span className="text-muted-foreground">(opțional)</span>
                    </Label>
                    <Textarea
                      id="tr-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ex. Aducem tricourile albastre"
                      rows={2}
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
          ) : (
            <a
              href={coachWhatsAppUrl(
                "Bună ziua! Am o întrebare despre programul de antrenamente.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <MessageCircle className="size-4" />
                Întreabă antrenorul
              </Button>
            </a>
          )
        }
      />

      {/* Location filter + export */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip
          active={locationFilter === "all"}
          onClick={() => setLocationFilter("all")}
          label="Toate locațiile"
        />
        {TRAINING_LOCATIONS.map((l) => (
          <FilterChip
            key={l}
            active={locationFilter === l}
            onClick={() => setLocationFilter(l)}
            label={l}
          />
        ))}
        {upcoming.length > 0 && (
          <span className="ml-auto">
            <AddToCalendarAllButton kind="training" items={upcoming} />
          </span>
        )}
      </div>

      {trainings === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <TrainingSection
            title="Următoarele antrenamente"
            icon={CalendarDays}
            items={upcoming}
            staff={staff}
            onDelete={requestDelete}
          />
          {past.length > 0 && (
            <TrainingSection
              title="Antrenamente trecute"
              icon={Clock}
              items={past}
              staff={staff}
              onDelete={requestDelete}
              muted
            />
          )}
          {filtered.length === 0 && (
            <Card className="club-card border-dashed">
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                <CalendarDays className="size-8 text-muted-foreground" />
                <p className="font-medium">Niciun antrenament aici</p>
                <p className="text-sm text-muted-foreground">
                  {locationFilter === "all"
                    ? "Programul urmează să fie anunțat."
                    : "Nu există antrenamente la această locație."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete series confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi întreaga serie?</AlertDialogTitle>
            <AlertDialogDescription>
              Acest antrenament face parte dintr-o serie săptămânală (
              {deleteTarget ? formatDayName(deleteTarget.date).toLowerCase() : ""}
              , ora {deleteTarget?.time}). Poți șterge doar această apariție sau
              toate antrenamentele din serie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              className="w-full bg-destructive text-white hover:bg-destructive/90 sm:w-full"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteSeries();
              }}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Șterge întreaga serie
            </AlertDialogAction>
            <Button
              variant="outline"
              className="w-full sm:w-full"
              disabled={deleting}
              onClick={() => {
                const id = deleteTarget?._id;
                setDeleteTarget(null);
                if (id) void handleDeleteSingle(id);
              }}
            >
              Șterge doar această apariție
            </Button>
            <AlertDialogCancel className="w-full sm:w-full">
              Anulează
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-gold/60 bg-gold text-gold-foreground"
          : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
      }`}
    >
      {label !== "Toate locațiile" && <MapPin className="size-3.5" />}
      {label}
    </button>
  );
}

function TrainingSection({
  title,
  icon: Icon,
  items,
  staff,
  onDelete,
  muted,
}: {
  title: string;
  icon: typeof CalendarDays;
  items: Doc<"trainings">[];
  staff: boolean;
  onDelete: (t: Doc<"trainings">) => void;
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
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <Card
            key={t._id}
            className={`club-card group relative overflow-hidden ${muted ? "opacity-90" : ""}`}
          >
            {staff && (
              <button
                type="button"
                onClick={() => onDelete(t)}
                aria-label="Șterge antrenamentul"
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-60 md:group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <CardContent className="flex items-start gap-4 p-5">
              <span className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-gold/10 px-2 py-3">
                <span className="text-xl font-bold leading-none text-gold">
                  {t.date.slice(8, 10)}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatDateRO(t.date).split(" ")[1]?.slice(0, 3)}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  {formatDayName(t.date)}
                  {t.seriesId && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-gold/40 px-1.5 py-0 text-[11px] font-semibold text-gold"
                    >
                      <Repeat className="size-3" />
                      Săptămânal
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatLongDateRO(t.date)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-secondary text-secondary-foreground">
                    <Clock className="mr-1 size-3" />
                    {t.time}
                  </Badge>
                  {t.group && <Badge variant="outline">{t.group}</Badge>}
                </div>
                <p className="mt-2.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {t.location}
                </p>
                {t.notes && (
                  <p className="mt-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                    {t.notes}
                  </p>
                )}
                <div className="mt-3">
                  <AddToCalendarButton kind="training" item={t} />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/70 via-gold/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </Card>
        ))}
      </div>
    </section>
  );
}
