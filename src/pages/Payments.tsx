import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { coachPhoneConfigured, coachWhatsAppUrl, isStaff } from "@/lib/club";
import {
  BadgeCheck,
  CircleAlert,
  CreditCard,
  Download,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

function monthLabel(m: string): string {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTH_NAMES[(mm ?? 1) - 1]} ${y}`;
}

function lastNMonths(n: number): string[] {
  const now = new Date();
  const b = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(b.getFullYear(), b.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/* ---------- export Excel (CSV compatibil Excel, UTF-8 BOM, separator ; ) ---------- */

function csvField(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatPaidDate(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type OverviewRow = {
  athleteName: string;
  ageGroup: string | null;
  status: "paid" | "unpaid";
  amount: number | null;
  paidAt: number | null;
};

export function downloadPaymentsCsv(
  month: string,
  rows: OverviewRow[],
): void {
  const paid = rows.filter((r) => r.status === "paid").length;
  const unpaid = rows.length - paid;

  const lines: string[] = [
    csvField("ACS Cavalerii Suceava — Situație cotizații"),
    csvField("Luna"),
    csvField(monthLabel(month)),
    "",
    [
      csvField("Nume sportiv"),
      csvField("Grupa"),
      csvField("Status"),
      csvField("Suma (lei)"),
      csvField("Data plății"),
    ].join(";"),
    ...rows.map((r) =>
      [
        csvField(r.athleteName),
        csvField(r.ageGroup ?? "—"),
        csvField(r.status === "paid" ? "Achitat" : "Restant"),
        csvField(r.amount ?? ""),
        csvField(formatPaidDate(r.paidAt)),
      ].join(";"),
    ),
    "",
    `${csvField("Total achitate")};${paid}`,
    `${csvField("Total restante")};${unpaid}`,
    `${csvField("Total sportivi")};${rows.length}`,
  ];

  // BOM UTF-8: Excel recunoaște diacriticele românești
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotizatii-cavalerii-${month}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Payments() {
  const { user } = useAuth();
  const staff = isStaff(user?.clubRole);
  return (
    <AppShell>
      <PageHeader
        title="Cotizații"
        subtitle={
          staff
            ? "Statusul plăților lunare pentru toți sportivii."
            : "Statusul cotizației și istoricul plăților."
        }
      />
      {staff ? <StaffPayments /> : <MemberPayments />}
    </AppShell>
  );
}

/* ---------------- member (sportiv / părinte) ---------------- */

function MemberPayments() {
  const summary = useQuery(api.features.myPaymentSummary);
  const { user } = useAuth();

  if (summary === undefined) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (summary === null) {
    return (
      <Card className="club-card border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <CreditCard className="size-8 text-muted-foreground" />
          <p className="font-medium">Contul tău nu e asociat unui sportiv</p>
          <p className="text-sm text-muted-foreground">
            Cotizația se urmărește per sportiv. Contactează antrenorul pentru
            asociere.
          </p>
        </CardContent>
      </Card>
    );
  }

  const unpaid = summary.currentStatus === "unpaid";
  const month = summary.month;

  return (
    <div className="flex flex-col gap-5">
      {/* reminder banner */}
      <Card
        className={cn(
          "club-card overflow-hidden",
          unpaid ? "border-destructive/40" : "border-emerald-500/30",
        )}
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl",
              unpaid ? "bg-destructive/10 text-destructive" : "bg-emerald-500/15 text-emerald-500",
            )}
          >
            {unpaid ? <CircleAlert className="size-6" /> : <BadgeCheck className="size-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug">
              {unpaid
                ? `Cotizația ${monthLabel(month)} — neachitată`
                : `Cotizația ${monthLabel(month)} — achitată`}
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {unpaid
                ? "Te rugăm să achiți cotizația până pe data de 10 ale lunii. Poți trimite dovada plății direct antrenorului."
                : `Mulțumim! Plata pentru ${monthLabel(month)} este înregistrată.`}
            </p>
          </div>
          {unpaid && coachPhoneConfigured && (
            <a
              href={coachWhatsAppUrl(
                `Bună ziua! Trimit dovada plății cotizației ${monthLabel(month)} pentru ${summary.athleteName}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                <MessageCircle className="size-4" />
                Trimite dovada
              </Button>
            </a>
          )}
        </CardContent>
      </Card>

      {/* istoric */}
      <Card className="club-card">
        <CardContent className="p-5">
          <p className="flex items-center gap-2 font-semibold">
            <CreditCard className="size-4 text-gold" />
            Istoric plăți — {summary.athleteName}
          </p>
          <Separator className="my-4" />
          {summary.history.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Încă nu există plăți înregistrate.
            </p>
          ) : (
            <ul className="flex flex-col">
              {summary.history.map((p, i) => (
                <li key={p._id}>
                  {i > 0 && <Separator className="my-1 opacity-50" />}
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm font-medium">{monthLabel(p.month)}</span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: "paid" | "unpaid" }) {
  return status === "paid" ? (
    <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15">
      <BadgeCheck className="mr-1 size-3" />
      Achitat
    </Badge>
  ) : (
    <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
      <CircleAlert className="mr-1 size-3" />
      Restant
    </Badge>
  );
}

/* ---------------- staff ---------------- */

function StaffPayments() {
  const months = useMemo(() => lastNMonths(6), []);
  const [month, setMonth] = useState(months[0]);
  const overview = useQuery(api.features.paymentsOverview, { month });
  const setPaymentStatus = useMutation(api.features.setPaymentStatus);
  const [pending, setPending] = useState<string | null>(null);
  const [amount, setAmount] = useState("150");

  const handleSet = async (
    userId: Id<"users">,
    status: "paid" | "unpaid",
    key: string,
  ) => {
    setPending(key);
    try {
      await setPaymentStatus({
        userId,
        month,
        status,
        amount: amount.trim() ? Number(amount) : undefined,
      });
      toast.success(
        status === "paid" ? "Plată marcată ca achitată." : "Plată marcată ca restantă.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la salvare.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label>Luna</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pay-amount">Suma (lei)</Label>
          <Input
            id="pay-amount"
            type="number"
            className="w-32"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => {
            if (!overview) return;
            downloadPaymentsCsv(month, overview.rows);
            toast.success("Fișierul a fost descărcat.");
          }}
          disabled={!overview || overview.rows.length === 0}
        >
          <Download className="size-4" />
          Export Excel
        </Button>
      </div>

      {overview === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : overview.rows.length === 0 ? (
        <Card className="club-card border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="font-medium">Niciun sportiv înregistrat</p>
            <p className="text-sm text-muted-foreground">
              Cotizațiile apar aici după ce sportivii își creează conturile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="club-card">
          <CardContent className="p-5">
            <p className="flex items-center gap-2 font-semibold">
              <CreditCard className="size-4 text-gold" />
              {monthLabel(month)} — {overview.rows.filter((r) => r.status === "paid").length}
              /{overview.rows.length} achitate
            </p>
            <Separator className="my-4" />
            <ul className="flex flex-col">
              {overview.rows.map((r, i) => (
                <li key={r.athleteId}>
                  {i > 0 && <Separator className="my-1 opacity-50" />}
                  <div className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">
                        {r.athleteName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.ageGroup ?? "—"}
                      </p>
                    </div>
                    <PaymentStatusBadge status={r.status} />
                    <div className="flex gap-2">
                      {r.status === "unpaid" ? (
                        <Button
                          size="sm"
                          onClick={() => handleSet(r.athleteId, "paid", r.athleteId)}
                          disabled={pending === r.athleteId}
                        >
                          {pending === r.athleteId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="size-4" />
                          )}
                          Marchează achitat
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSet(r.athleteId, "unpaid", r.athleteId)}
                          disabled={pending === r.athleteId}
                        >
                          Anulează
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
