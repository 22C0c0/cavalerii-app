import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ClubLogo } from "@/components/ClubLogo";
import { ArrowLeft, ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Nu am putut trimite codul de verificare. Încearcă din nou.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("Codul introdus este incorect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  return (
    <div className="flex min-h-screen bg-sidebar">
      {/* Left brand panel (desktop) */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute -left-24 top-1/3 size-96 rounded-full bg-gold/10 blur-3xl" />
        <button
          type="button"
          onClick={() => navigate("/")}
          className="relative flex w-fit items-center gap-2 text-sm text-white/95 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Înapoi la pagina principală
        </button>
        <div className="relative">
          <ClubLogo
            alt="Stema ACS Cavalerii Suceava"
            className="mb-8 w-44 drop-shadow-2xl"
          />
          <h1 className="text-3xl font-extrabold leading-tight text-white">
            Cavalerii Suceava
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/90">
            Aplicația oficială a clubului: antrenamente, competiții și contact
            direct cu antrenorul — totul într-un singur loc.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs text-white/80">
            <ShieldCheck className="size-4 text-gold" />
            Conturile sunt protejate cu cod de verificare pe email.
          </div>
        </div>
        <p className="relative text-xs text-white/75">
          © 2025 ACS Cavalerii Suceava · Bleumarin & Auriu
        </p>
      </div>

      {/* Right auth content */}
      <div className="flex flex-1 flex-col bg-background lg:rounded-l-3xl">
        <div className="p-4 lg:hidden">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Pagina principală
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10">
          <Card className="min-w-[350px] pb-0 shadow-xl shadow-primary/10">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center">
                  <div className="flex justify-center">
                    <ClubLogo
                      alt="ACS Cavalerii Suceava"
                      width={72}
                      height={72}
                      className="mb-4 mt-4 cursor-pointer rounded-xl"
                      onClick={() => navigate("/")}
                    />
                  </div>
                  <CardTitle className="text-xl">
                    Intră în Cavalerii
                  </CardTitle>
                  <CardDescription>
                    Introdu adresa de email pentru conectare sau înregistrare
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                  <CardContent>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="nume@exemplu.ro"
                          type="email"
                          className="pl-9"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-500">{error}</p>
                    )}

                    <div className="mt-4 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2 text-xs text-muted-foreground">
                      Accesul se face exclusiv cu email + cod de verificare.
                    </div>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="mt-4 text-center">
                  <CardTitle>Verifică-ți emailul</CardTitle>
                  <CardDescription>
                    Am trimis un cod la {step.email}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            otp.length === 6 &&
                            !isLoading
                          ) {
                            const form = (e.target as HTMLElement).closest(
                              "form",
                            );
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="mt-2 text-center text-sm text-red-500">
                        {error}
                      </p>
                    )}
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Nu ai primit codul?{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => setStep("signIn")}
                      >
                        Încearcă din nou
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se verifică...
                        </>
                      ) : (
                        <>
                          Verifică codul
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("signIn")}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Folosește alt email
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}

            <div className="rounded-b-lg border-t bg-muted px-6 py-4 text-center text-xs text-muted-foreground">
              Prima dată aici? Vei alege rolul tău (antrenor, sportiv sau
              părinte) imediat după conectare.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
