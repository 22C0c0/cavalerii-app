import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { coachPhoneConfigured, coachWhatsAppUrl } from "@/lib/club";
import { ClubLogo } from "@/components/ClubLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Program antrenamente",
    description:
      "Calendar clar, filtrat pe locații: Horodnic de Sus și Școala nr. 11 „Miron Costin”. Știi mereu unde și când e echipa.",
  },
  {
    icon: Trophy,
    title: "Competiții & evenimente",
    description:
      "Etape, meciuri amicale și evenimente de club — vizibile simultan pentru sportivi și părinți, cu detalii complete.",
  },
  {
    icon: MessageCircle,
    title: "Contact direct antrenor",
    description:
      "Un buton de WhatsApp mereu la îndemână. Fără grupuri pierdute, fără mesaje necitite.",
  },
];

const ROLES = [
  {
    label: "Antrenor",
    description: "Publică programul și anunță echipa în câteva secunde.",
  },
  {
    label: "Sportiv",
    description: "Vezi următorul antrenament și unde ajungi cu echipa.",
  },
  {
    label: "Părinte",
    description: "Tot programul copilului, într-un singur loc, simplu și clar.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <ClubLogo className="size-10 rounded-lg" />
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                ACS
              </p>
              <p className="text-sm font-bold text-white">Cavalerii Suceava</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {coachPhoneConfigured && (
              <Button
                asChild
                variant="ghost"
                className="hidden text-white/95 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <a
                  href={coachWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp antrenor
                </a>
              </Button>
            )}
            <Button
              asChild
              className="bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
            >
              <a href="/auth">Intră în aplicație</a>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-16 sm:px-6 sm:pb-36 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Badge className="mb-6 border border-gold/30 bg-gold/10 text-gold">
                <ShieldCheck className="size-3.5" />
                Club de baschet · Suceava · din 2025
              </Badge>
              <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
                Echipa ta,
                <br />
                <span className="text-gold">tot programul</span>, într-o
                singură aplicație.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
                Aplicația oficială de management a clubului{" "}
                <span className="font-semibold text-white">
                  ACS Cavalerii Suceava
                </span>
                . Antrenamente, competiții și legătura directă cu antrenorul —
                pentru sportivi și părinți.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-gold px-6 text-base font-semibold text-gold-foreground shadow-lg shadow-gold/20 hover:bg-gold/90"
                >
                  <a href="/auth">
                    Creează cont sau intră
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="#functii">Vezi ce poți face</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-white/85">
                Antrenor · Sportiv · Părinte — fiecare cu vederea lui, în
                română.
              </p>
            </motion.div>

            {/* Crest card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="mx-auto w-full max-w-sm"
            >
              <div className="club-card relative overflow-hidden rounded-2xl border-white/10 bg-white/5 p-8 backdrop-blur">
                <div className="absolute -right-16 -top-16 size-48 rounded-full bg-gold/10 blur-3xl" />
                <ClubLogo
                  alt="Stema ACS Cavalerii Suceava"
                  className="mx-auto w-56 drop-shadow-2xl"
                />
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  {["U8 – U18", "2 săli", "2025"].map((stat) => (
                    <div
                      key={stat}
                      className="rounded-lg border border-white/10 bg-black/30 px-2 py-3"
                    >
                      <p className="text-sm font-bold text-gold">{stat}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-xs leading-relaxed text-white/85">
                  Grupe de copii și juniori · Sala Horodnic de Sus · Școala
                  Gimnazială nr. 11 „Miron Costin”
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="functii" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Versiunea 1
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Esențialul clubului, făcut bine
          </h2>
          <p className="mt-3 text-muted-foreground">
            Fără zgomot. Doar ce au nevoie sportivii și părinții, zi de zi.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.1 }}
            >
              <div className="club-card club-card-hover h-full p-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ROLES */}
        <motion.div {...fadeUp} className="mt-16">
          <div className="club-card overflow-hidden">
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {ROLES.map((r) => (
                <div key={r.label} className="bg-card p-6">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-gold" />
                    <p className="font-semibold">{r.label}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {r.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp}>
          <div className="club-card mt-16 flex flex-col items-center gap-6 rounded-2xl border-gold/20 bg-sidebar p-10 text-center">
            <ClubLogo className="size-16 rounded-xl" />
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Gata de sezon? Intră în cavalerie.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/90">
                Creează-ți cont cu emailul tău, alege rolul și ai tot programul
                clubului în buzunar.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 bg-gold px-8 text-base font-semibold text-gold-foreground hover:bg-gold/90"
            >
              <a href="/auth">
                Începe acum
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/70">
        <div
          className={cn(
            "mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6",
          )}
        >
          <div className="flex items-center gap-3">
            <ClubLogo className="size-8 rounded-md" />
            <p className="text-sm font-semibold">
              ACS Cavalerii Suceava{" "}
              <span className="font-normal text-muted-foreground">
                · aplicația clubului
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Horodnic de Sus · Școala Gimnazială nr. 11 „Miron Costin” Suceava
          </p>
        </div>
      </footer>
    </div>
  );
}
