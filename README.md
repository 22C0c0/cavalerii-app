# ACS Cavalerii Suceava — Aplicație de management al clubului

Aplicația web (PWA) a clubului de baschet **ACS Cavalerii Suceava** — un centru unic pentru antrenor, sportivi și părinți: program de antrenamente, competiții, prezență, cotizații și legătura directă cu antrenorul.

## ✨ Funcționalități

- **Dashboard** — următorul antrenament, următoarea competiție, anunțuri recente și acces rapid la contact
- **Calendar de antrenamente** — filtrabil după locație (Horodnic de Sus / Școala Generală nr. 11 „Miron Costin" Suceava), cu **programare recurentă săptămânală** (ex. „în fiecare miercuri" — generează automat întreaga serie)
- **Competiții și evenimente** — dată, oră, locație, descriere; vizibile sportivilor și părinților
- **Anunțuri de la antrenor** — comunicări către toată echipa, cu notificări in-app
- **Prezență la antrenamente** — marcarea prezent/absent/motivat, per sportiv
- **Cotizații lunare** — status achitat/restant per sportiv, istoric plăți, reminder vizibil sportivului și părintelui asociat, plus **export Excel/CSV** al situației lunare (pentru staff)
- **Contact antrenor pe WhatsApp** — deep link direct (`wa.me`), cu mesaj pre-completat, disponibil pe toate ecranele
- **Notificări in-app** — clopoțel cu anunțuri și evenimente noi
- **PWA instalabilă** — „Adaugă pe ecranul de start" pe telefon, merge ca o aplicație nativă

## 👥 Roluri

| Rol | Cum se obține | Ce poate |
|---|---|---|
| **Antrenor / Administrator** | atribuit automat pe email (lista `STAFF_EMAILS` din `src/convex/schema.ts`) | tot: antrenamente, competiții, anunțuri, prezențe, cotizații, export |
| **Sportiv** | auto-înregistrare (email + cod OTP, fără parole) | program, competiții, anunțuri, istoricul propriilor cotizații |
| **Părinte** | auto-înregistrare + asociere cu sportivul | programul copilului, competiții, cotizații, contact antrenor |

Rolurile de conducere **nu se pot alege la înregistrare** — se atașează exclusiv de adresele din lista de staff (securitate la nivel de server).

## 🧱 Tehnologii

- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, Framer Motion, React Router v7
- **Backend:** Convex (bază de date + funcții serverless) și Convex Auth (autentificare email OTP, fără parole)
- **PWA:** manifest + iconițe, instalabilă pe Android/iOS/desktop

## 📁 Structura aplicației

```
src/
  pages/
    Landing.tsx        # pagina publică a clubului
    Auth.tsx           # autentificare prin email OTP
    Onboarding.tsx     # alegere rol (Sportiv/Părinte) + asociere părinte–sportiv
    Dashboard.tsx      # rezumat personal + acces rapid
    Trainings.tsx      # calendar antrenamente + recurență săptămânală
    Events.tsx         # competiții și evenimente
    Announcements.tsx  # anunțuri de la antrenor
    Attendance.tsx     # prezență la antrenamente
    Payments.tsx       # cotizații + export Excel (staff)
  components/
    AppShell.tsx       # sidebar desktop + navigare mobilă + butoane contact
    NotificationsBell.tsx, ClubLogo.tsx, RequireAuth.tsx, ...
  convex/
    schema.ts          # users (roluri, STAFF_EMAILS), trainings, events, payments, attendance, announcements
    club.ts            # profil, antrenamente (inclusiv serii recurente), evenimente
    features.ts        # anunțuri, prezențe, cotizații, notificări, paymentsOverview
    users.ts           # sincronizare roluri staff, setUserRole
  lib/
    club.ts            # locații, grupe de vârstă, WhatsApp antrenor, formatare date în română
```

## 🚀 Rulare locală

```bash
bun install
bun convex dev --once   # codegen + sincronizare funcții Convex
bun run dev             # pornește aplicația Vite
```

Aplicația pornește pe `http://localhost:5173`.

> **Personalizare:** numărul de WhatsApp al antrenorului **nu se scrie în cod** — se setează ca variabilă de mediu `VITE_COACH_PHONE` (format internațional fără „+", ex. `40755287562`), local în `.env.local` sau ca secret pe GitHub. Fără această variabilă, butoanele de contact WhatsApp se ascund automat. Emailurile de staff se configurează în `src/convex/schema.ts` (`STAFF_EMAILS`).

## 🌐 Deploy pe GitHub Pages

Workflow-ul `.github/workflows/deploy.yml` construiește automat proiectul și îl publică pe
GitHub Pages la fiecare push pe `main`.

### Configurare (o singură dată)

1. **Încarcă codul în repo:**
   ```bash
   git init && git add . && git commit -m "ACS Cavalerii Suceava"
   git remote add origin https://github.com/<utilizator>/<nume-repo>.git
   git push -u origin main
   ```
2. **Secrete pentru build:** *Settings → Secrets and variables → Actions → New repository secret*
   - `VITE_CONVEX_URL` — URL-ul deployment-ului Convex (ex. `https://handsome-canary-25.convex.cloud`)
   - `VITE_COACH_PHONE` — numărul de WhatsApp al antrenorului, format internațional fără „+" (nu se află niciodată în cod)
3. **Activează Pages:** *Settings → Pages → Build and deployment → Source = **GitHub Actions***

La fiecare push pe `main`, site-ul se publică automat la `https://<utilizator>.github.io/<nume-repo>/`.

### Note

- **Backend-ul rămâne pe Convex** — Pages servește doar interfața. La modificări în `src/convex/`, rulează local `bunx convex deploy` pentru sincronizare.
- Pentru **domeniu propriu** (ex. `cavaleriisuceava.ro`): adaugă `public/CNAME` cu domeniul, configurează DNS la registrar și setează `VITE_BASE_PATH="/"` în workflow.

## 📄 Licență

Cod destinat clubului ACS Cavalerii Suceava. Toate drepturile asupra mărcii și siglei aparțin clubului.
