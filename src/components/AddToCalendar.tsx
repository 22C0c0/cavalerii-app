import { Button } from "@/components/ui/button";
import {
  downloadICS,
  eventToICS,
  trainingToICS,
} from "@/lib/calendar";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  kind: "training" | "event";
  item:
    | Parameters<typeof trainingToICS>[0]
    | Parameters<typeof eventToICS>[0];
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  label?: string;
};

export function AddToCalendarButton({
  kind,
  item,
  variant = "outline",
  size = "sm",
  label,
}: Props) {
  const handle = () => {
    try {
      const entry = kind === "training" ? trainingToICS(item as never) : eventToICS(item as never);
      const filename =
        kind === "training"
          ? `antrenament-${entry.date}.ics`
          : `${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${entry.date}.ics`;
      downloadICS(filename, [entry]);
      toast.success("Event descărcat — deschide-l pentru a-l adăuga în calendar.");
    } catch {
      toast.error("Nu am putut genera fișierul de calendar.");
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handle}>
      <CalendarPlus className="size-4" />
      {label ?? "În calendar"}
    </Button>
  );
}

export function AddToCalendarAllButton({
  kind,
  items,
}: {
  kind: "training" | "event";
  items: Array<Parameters<typeof trainingToICS>[0] | Parameters<typeof eventToICS>[0]>;
}) {
  if (items.length === 0) return null;
  const handle = () => {
    try {
      const entries =
        kind === "training"
          ? (items as never[]).map(trainingToICS)
          : (items as never[]).map(eventToICS);
      downloadICS(`cavalerii-suceava-${kind}s.ics`, entries);
      toast.success(
        `${entries.length} evenimente exportate — deschide fișierul pentru a le importa.`,
      );
    } catch {
      toast.error("Nu am putut genera fișierul de calendar.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handle}>
      <CalendarPlus className="size-4" />
      Toate în calendar ({items.length})
    </Button>
  );
}

export function AddToCalendarSkeleton() {
  return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
}
