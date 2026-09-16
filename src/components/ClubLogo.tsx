import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Sigla oficială ACS Cavalerii Suceava (public/logo.png, 1024×1024, fundal
 * transparent). BASE_URL face referința corectă și pe GitHub Pages, unde
 * aplicația rulează sub /cavalerii-app/ (base: VITE_BASE_PATH în vite.config).
 */
const LOGO_SRC = `${import.meta.env.BASE_URL}logo.png`;

type ClubLogoProps = ImgHTMLAttributes<HTMLImageElement> & { alt?: string };

export function ClubLogo({ alt, className, ...props }: ClubLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt ?? "ACS Cavalerii Suceava"}
      className={cn("select-none object-contain", className)}
      draggable={false}
      {...props}
    />
  );
}
