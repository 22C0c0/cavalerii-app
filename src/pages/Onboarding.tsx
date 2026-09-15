import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { ClubLogo } from "@/components/ClubLogo";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AGE_GROUPS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  CLUB_NAME,
  initialsOf,
} from "@/lib/club";
import { CLUB_ROLES, type ClubRole } from "@/convex/schema";
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

const ROLE_ICONS: Record<ClubRole, typeof User> = {
  coach: GraduationCap,
  athlete: User,
  parent: Users,
  admin: Shield,
};

const SELECTABLE_ROLES: ClubRole[] = [
  CLUB_ROLES.COACH,
  CLUB_ROLES.ATHLETE,
  CLUB_ROLES.PARENT,
  CLUB_ROLES.ADMIN,
];

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const athletes = useQuery(api.club.listAthletes) ?? [];
  const completeProfile = useMutation(api.club.completeProfile);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<ClubRole | null>(null);
  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
  const [athleteId, setAthleteId] = useState<string>("");
  const [athleteName, setAthleteName] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>("U12");
  const [saving, setSaving] = useState(false);

  if (!isLoading && !user) {
    navigate("/auth");
    return null;
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Completează numele și prenumele.");
      return;
    }
    if (!role) {
      toast.error("Alege rolul tău în club.");
      return;
    }
    if (
      role === CLUB_ROLES.PARENT &&
      linkMode === "existing" &&
      !athleteId
    ) {
      toast.error(
        "Alege sportivul copilului tău din listă sau adaugă unul nou.",
      );
      return;
    }
    setSaving(true);
    try {
      await completeProfile({
        name: name.trim(),
        clubRole: role,
        phone: phone.trim() || undefined,
        athleteId:
          role === CLUB_ROLES.PARENT && linkMode === "existing" && athleteId
            ? (athleteId as Id<"users">)
            : undefined,
        athleteName:
          role === CLUB_ROLES.PARENT && linkMode === "new"
            ? athleteName.trim()
            : undefined,
        ...(role === CLUB_ROLES.ATHLETE ? { ageGroup } : {}),
      });
      toast.success("Bine ai venit în cavalerie!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A apărut o eroare.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-sidebar">
      <div className="absolute inset-0 bg-grid-dark" />
      <div className="absolute -right-32 top-0 size-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <ClubLogo
            alt=""
            className="mx-auto mb-4 size-16 rounded-xl"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {CLUB_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Bine ai venit{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/90">
            spune-ne cine ești ca să-ți arătăm exact ce contează: antrenamente,
            competiții și legătura cu antrenorul.
          </p>
        </div>

        <Card className="club-card p-0">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <Label htmlFor="onb-name">Nume și prenume</Label>
              <Input
                id="onb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Andrei Popescu"
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="onb-phone">
                Telefon <span className="text-muted-foreground">(opțional)</span>
              </Label>
              <Input
                id="onb-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xx xxx xxx"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Rolul tău în club</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {SELECTABLE_ROLES.map((r) => {
                  const Icon = ROLE_ICONS[r];
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-gold bg-gold/10 shadow-sm ring-1 ring-gold/40"
                          : "border-border bg-card hover:border-primary/30 hover:bg-accent/50"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span
                          className={`flex size-8 items-center justify-center rounded-lg ${
                            active
                              ? "bg-gold text-gold-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>
                        {ROLE_LABELS[r]}
                      </span>
                      <span className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {ROLE_DESCRIPTIONS[r]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {role === CLUB_ROLES.ATHLETE && (
              <div className="flex flex-col gap-2">
                <Label>Grupa ta de vârstă</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alege grupa" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === CLUB_ROLES.PARENT && (
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
                <Label>Copilul tău (sportivul)</Label>
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant={linkMode === "existing" ? "default" : "outline"}
                    onClick={() => setLinkMode("existing")}
                  >
                    Cont existent
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={linkMode === "new" ? "default" : "outline"}
                    onClick={() => setLinkMode("new")}
                  >
                    Adaugă nume nou
                  </Button>
                </div>
                {linkMode === "existing" ? (
                  athletes.length > 0 ? (
                    <Select value={athleteId} onValueChange={setAthleteId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Alege sportivul" />
                      </SelectTrigger>
                      <SelectContent>
                        {athletes.map((a) => (
                          <SelectItem key={a._id} value={a._id}>
                            {a.name || "Sportiv"}{" "}
                            {a.ageGroup ? `· ${a.ageGroup}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Momentan nu există conturi de sportiv. Copilul tău își
                      poate face contul alegând rolul „Sportiv”, apoi îl
                      conectezi aici. Poți continua și adăugând numele lui.
                    </p>
                  )
                ) : (
                  <Input
                    value={athleteName}
                    onChange={(e) => setAthleteName(e.target.value)}
                    placeholder="Numele și prenumele copilului"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Vei vedea programul și competițiile copilului tău în același
                  loc.
                </p>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              className="mt-2 w-full"
              onClick={handleSave}
              disabled={saving || isLoading}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Intră în aplicație
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-white/75">
          {initialsOf(user?.name)} · contul tău este creat doar cu adresa de
          email, fără parole de reținut.
        </p>
      </div>
    </main>
  );
}
