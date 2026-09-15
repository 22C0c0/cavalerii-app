import type { SVGProps } from "react";

type ClubLogoProps = SVGProps<SVGSVGElement> & { alt?: string };

/**
 * Marcă temporară a clubului (monogramă „CS” pe scut, în paleta
 * bleumarin / auriu / bordo). Sigla oficială NU este afișată momentan —
 * fișierele rămân în `public/` (logo.png, logo-192.png, logo-512.png)
 * și pot fi reactivate oricând înlocuind acest SVG cu <img src="/logo.png" />.
 */
export function ClubLogo({ alt, ...props }: ClubLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={alt ?? "ACS Cavalerii Suceava"}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* scut bleumarin, contur auriu */}
      <path
        d="M32 3.5 55 11v19.5C55 46 45.8 56.4 32 61 18.2 56.4 9 46 9 30.5V11L32 3.5Z"
        fill="#0A2540"
        stroke="#C9A84C"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* filigran interior auriu */}
      <path
        d="M32 8.2 50.8 14.2v16.3c0 11.6-6.6 19.4-18.8 23.7-12.2-4.3-18.8-12.1-18.8-23.7V14.2L32 8.2Z"
        fill="none"
        stroke="#C9A84C"
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      {/* monogramă */}
      <text
        x={32}
        y={41}
        textAnchor="middle"
        fontSize={26}
        fontWeight={800}
        fill="#C9A84C"
      >
        CS
      </text>
      {/* chevron bordo */}
      <path d="M21 46.5h22v3.2l-11 5.6-11-5.6v-3.2Z" fill="#7A1F2B" />
    </svg>
  );
}
