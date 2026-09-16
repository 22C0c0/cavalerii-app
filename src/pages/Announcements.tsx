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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { coachPhoneConfigured, coachWhatsAppUrl, isStaff } from "@/lib/club";
import {
  Loader2,
  Megaphone,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Announcements() {
  const { user } = useAuth();
  const announcements = useQuery(api.features.listAnnouncements);
  const addAnnouncement = useMutation(api.features.addAnnouncement);
  const deleteAnnouncement = useMutation(api.features.deleteAnnouncement);

  const staff = isStaff(user?.clubRole);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Completează titlul și textul anunțului.");
      return;
    }
    setSaving(true);
    try {
      await addAnnouncement({ title: title.trim(), body: body.trim() });
      toast.success("Anunț publicat — apare pentru toți membrii clubului.");
      setOpen(false);
      setTitle("");
      setBody("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A apărut o eroare.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Doc<"announcements">["_id"]) => {
    try {
      await deleteAnnouncement({ id });
      toast.success("Anunț șters.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A apărut o eroare.");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Anunțuri"
        subtitle="Comunicările oficiale ale clubului."
        action={
          staff ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Anunț nou
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Anunț nou</DialogTitle>
                  <DialogDescription>
                    Publicat instantaneu pentru sportivi și părinți. Apare și în
                    notificările tuturor.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="an-title">Titlu</Label>
                    <Input
                      id="an-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ex. Meciul de sâmbătă se mută la ora 11:00"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="an-body">Text</Label>
                    <Textarea
                      id="an-body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Scrie detaliile importante aici…"
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Anulează
                  </Button>
                  <Button onClick={handleAdd} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Publică
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : coachPhoneConfigured ? (
            <a
              href={coachWhatsAppUrl("Bună ziua!")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <MessageCircle className="size-4" />
                Contact antrenor
              </Button>
            </a>
          ) : null
        }
      />

      {announcements === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="club-card border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Megaphone className="size-8 text-muted-foreground" />
            <p className="font-medium">Nicio comunicare încă</p>
            <p className="text-sm text-muted-foreground">
              {staff
                ? "Publică primul anunț pentru club."
                : "Anunțurile antrenorului vor apărea aici."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <Card key={a._id} className="club-card group relative overflow-hidden">
              {staff && (
                <button
                  type="button"
                  onClick={() => handleDelete(a._id)}
                  aria-label="Șterge anunțul"
                  className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-60 md:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Megaphone className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-gold text-gold-foreground">Anunț</Badge>
                    {a.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString("ro-RO", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base font-bold leading-snug">{a.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
