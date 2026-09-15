import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  CreditCard,
  Loader2,
  Megaphone,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const KIND_META = {
  announcement: { icon: Megaphone, label: "Anunț", tint: "text-gold bg-gold/15" },
  training: { icon: CalendarDays, label: "Antrenament", tint: "text-gold bg-gold/10" },
  event: { icon: Trophy, label: "Calendar", tint: "text-bordo bg-bordo/20" },
  payment: { icon: CreditCard, label: "Cotizație", tint: "text-destructive bg-destructive/10" },
} as const;

export function NotificationsBell() {
  const data = useQuery(api.features.getNotifications);
  const markRead = useMutation(api.features.markNotificationsRead);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  // când panoul se deschide, marchează tot ca citit după o scurtă întârziere
  useEffect(() => {
    if (!open || !data || data.unreadCount === 0) return;
    const t = setTimeout(() => {
      setMarking(true);
      markRead({})
        .catch(() => {})
        .finally(() => setMarking(false));
    }, 1200);
    return () => clearTimeout(t);
  }, [open, data, markRead]);

  const unread = data?.unreadCount ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificări"
          className="relative flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold transition-colors hover:bg-gold/25"
        >
          {data === undefined ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Bell className="size-4" />
          )}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-bordo px-1 text-[10px] font-bold leading-none text-white ring-2 ring-sidebar">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-85 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4 text-gold" />
            Notificări
            {unread > 0 && (
              <Badge className="bg-gold text-gold-foreground">{unread} noi</Badge>
            )}
          </p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markRead({})}
              disabled={marking}
              className="h-7 text-xs"
            >
              {marking ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Marchează citite
            </Button>
          )}
        </div>
        <Separator />
        {data === undefined ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nimic nou momentan. Programul și anunțurile apar aici.
          </p>
        ) : (
          <ScrollArea className="h-80">
            <ul className="flex flex-col">
              {data.items.map((n, i) => {
                const meta = KIND_META[n.kind];
                const Icon = meta.icon;
                return (
                  <li key={n.key}>
                    {i > 0 && <Separator className="opacity-50" />}
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-3",
                        n.unread && "bg-gold/5",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          meta.tint,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {meta.label}
                          {n.date ? ` · ${n.date}` : ""}
                        </p>
                      </div>
                      {n.unread && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
