import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubLogo } from "@/components/ClubLogo";
import { LogoDropdown } from "@/components/LogoDropdown";
import { useAuth } from "@/hooks/use-auth";
import {
  AGE_GROUPS,
  CLUB_NAME,
  ROLE_LABELS,
  coachPhoneConfigured,
  coachWhatsAppUrl,
  initialsOf,
  isStaff,
} from "@/lib/club";
import { NotificationsBell } from "@/components/NotificationsBell";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { CalendarCheck, CalendarDays, CreditCard, Home, Loader2, Megaphone, MessageCircle, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isStaffEmail } from "@/convex/schema";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Acasă", icon: Home },
  { to: "/trainings", label: "Antrenamente", icon: CalendarDays },
  { to: "/events", label: "Competiții", icon: Trophy },
  { to: "/announcements", label: "Anunțuri", icon: Megaphone },
  { to: "/attendance", label: "Prezență", icon: CalendarCheck },
  { to: "/payments", label: "Cotizații", icon: CreditCard },
] as const;

// bottom bar mobil: primele 3 + Cotizații (cele mai folosite)
const MOBILE_NAV = [
  { to: "/dashboard", label: "Acasă", icon: Home },
  { to: "/trainings", label: "Program", icon: CalendarDays },
  { to: "/announcements", label: "Anunțuri", icon: Megaphone },
  { to: "/payments", label: "Cotizații", icon: CreditCard },
] as const;

function NavLinks({ className }: { className?: string }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-gold"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              className,
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const syncMyStaffRole = useMutation(api.users.syncMyStaffRole);

  // Backfill: conturile de staff (email în STAFF_EMAILS) primesc/sincronizează
  // rolul automat, chiar dacă profilul e deja complet.
  useEffect(() => {
    if (
      !isLoading &&
      user &&
      isStaffEmail(user.email) &&
      user.clubRole !== "admin" &&
      user.clubRole !== "coach"
    ) {
      void syncMyStaffRole().catch(() => {});
    }
  }, [isLoading, user, syncMyStaffRole]);

  const role = user?.clubRole ?? null;
  const staff = isStaff(role);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 px-5 pb-4 pt-6 text-left"
        >
          <ClubLogo className="size-11 shrink-0 rounded-lg" />
          <span className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              ACS
            </span>
            <span className="text-sm font-bold leading-tight">
              Cavalerii Suceava
            </span>
          </span>
        </button>

        <div className="mx-5 mb-4 flex items-center justify-between">
          <div className="h-px flex-1 bg-sidebar-border" />
          <NotificationsBell />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/70">
            Meniu
          </p>
          <NavLinks />
        </nav>

        <div className="mx-5 mb-3 h-px bg-sidebar-border" />

        {/* Contact antrenor (vizibil doar dacă numărul e configurat) */}
        {coachPhoneConfigured && (
          <div className="px-4 pb-4">
            <a
              href={coachWhatsAppUrl(
                "Bună ziua! Vă contactez din aplicația ACS Cavalerii Suceava.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-3 transition-colors",
                "hover:border-gold/40 hover:bg-sidebar-accent",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <MessageCircle className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">Contact antrenor</span>
                <span className="text-xs text-sidebar-foreground/85 group-hover:text-gold">
                  WhatsApp — răspuns rapid
                </span>
              </span>
            </a>
          </div>
        )}

        {/* user card */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-gold-foreground">
              {initialsOf(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug break-words">{user.name}</p>
              <p className="text-xs leading-snug text-sidebar-foreground/85">
                {ROLE_LABELS[role ?? "none"]}
                {user.clubRole === "athlete" && user.ageGroup
                  ? ` · ${user.ageGroup}`
                  : ""}
              </p>
            </div>
            <LogoDropdown />
          </div>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-sidebar px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 text-left"
        >
          <ClubLogo className="size-9 rounded-md" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold">Cavalerii Suceava</span>
            <span className="text-xs font-medium uppercase tracking-wider text-gold">
              {ROLE_LABELS[role ?? "none"]}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          <NotificationsBell />
          {coachPhoneConfigured && (
            <a
              href={coachWhatsAppUrl(
                "Bună ziua! Vă contactez din aplicația ACS Cavalerii Suceava.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactează antrenorul pe WhatsApp"
              className="flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold transition-colors hover:bg-gold/25"
            >
              <MessageCircle className="size-4" />
            </a>
          )}
          <LogoDropdown />
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-64 lg:px-8 lg:pb-12 lg:pt-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* Buton plutitor WhatsApp (mobil) */}
      <FloatingWhatsApp />

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2">
          {MOBILE_NAV.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-primary/10",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        isStaff(role) ? "border-gold/50 text-gold" : "border-gold/30 text-gold",
      )}
    >
      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
    </Badge>
  );
}

export { AGE_GROUPS };
