import { MessageCircle } from "lucide-react";
import { coachPhoneConfigured, coachWhatsAppUrl } from "@/lib/club";

/**
 * Butonul plutitor WhatsApp pentru mobil — mereu vizibil deasupra navigării de
 * jos, ușor de apăsat cu degetul. Pe desktop rămâne cardul din bara laterală.
 */
export function FloatingWhatsApp() {
  if (!coachPhoneConfigured) return null;

  return (
    <a
      href={coachWhatsAppUrl(
        "Bună ziua! Vă contactez din aplicația ACS Cavalerii Suceava.",
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactează antrenorul pe WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition-transform active:scale-95 lg:hidden"
    >
      <MessageCircle className="size-7" />
      <span className="absolute -top-0.5 -right-0.5 flex size-3.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-3.5 rounded-full border-2 border-background bg-emerald-400" />
      </span>
    </a>
  );
}
