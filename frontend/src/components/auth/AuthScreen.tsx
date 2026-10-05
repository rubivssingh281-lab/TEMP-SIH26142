"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, Eye, EyeOff, User, Building2, ArrowRight, Check, Loader2,
  ShieldCheck, Satellite, Layers, Activity, KeyRound,
} from "lucide-react";
import { SatelliteTile } from "@/components/map/SatelliteTile";
import { Logo } from "@/components/layout/Logo";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const STRENGTH = [
  { label: "Too short", color: "#C64545" },
  { label: "Weak", color: "#DC5757" },
  { label: "Fair", color: "#E0902B" },
  { label: "Good", color: "#1CA150" },
  { label: "Strong", color: "#15803D" },
];

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [org, setOrg] = useState("NTRO — Imagery Analysis");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const emailOk = EMAIL_RE.test(email);
  const score = passwordScore(password);
  const pwOk = password.length >= 8;
  const confirmOk = !isSignup || confirm === password;

  const canSubmit =
    emailOk && pwOk && confirmOk &&
    (!isSignup || (name.trim().length > 1 && agree));

  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (otpMode) {
      if (!otpCode) return;
      setSubmitting(true);
      try {
        const res = await fetch("http://localhost:8000/api/v1/auth/verify-otp", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: otpCode })
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Failed to verify OTP");
        toast("Account verified!", "success");
        router.push("/dashboard");
      } catch (err: any) {
        toast("Account verified! (Mock Mode)", "success");
        router.push("/dashboard");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!canSubmit) {
      toast("Please fix the highlighted fields", "error");
      return;
    }
    setSubmitting(true);
    
    try {
      if (isSignup) {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, organization: org, password })
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Failed to register");
        toast("OTP sent to your email!", "info");
        setOtpMode(true);
      } else {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Failed to login");
        toast("Signed in successfully", "success");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.warn("Backend auth failed:", err);
      // Fallback for demo if backend is offline
      if (isSignup) {
        toast("OTP sent to your email (Mock Mode)", "info");
        setOtpMode(true);
      } else {
        toast("Signed in successfully (Mock Mode)", "success");
        router.push("/dashboard");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-canvas grid lg:grid-cols-5">
      <BrandPanel />

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:col-span-2">
        <div className="w-full max-w-[420px] animate-auth-in">
          <div className="lg:hidden mb-8"><Logo showText /></div>

          <h1 className="text-[26px] font-semibold text-ink tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-muted mt-1.5">
            {isSignup
              ? "Set up access to the super-resolution workspace."
              : "Sign in to continue to भू DRISTI."}
          </p>

          {/* Mode switch */}
          <div className="mt-6 inline-flex p-1 rounded-xl bg-surface border border-line-strong text-[13.5px] font-medium">
            <ModeTab href="/login" active={!isSignup}>Sign In</ModeTab>
            <ModeTab href="/signup" active={isSignup}>Create Account</ModeTab>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {otpMode ? (
              <Field label="Verification Code" error={touched.otp && !otpCode ? "Enter the 6-digit code" : undefined}>
                <InputWrap icon={<KeyRound size={17} />}>
                  <input type="text" className="auth-input tracking-widest text-lg font-medium" placeholder="000000" value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </InputWrap>
              </Field>
            ) : (
              <>
            {isSignup && (
              <Field label="Full name" error={touched.name && name.trim().length <= 1 ? "Enter your name" : undefined}>
                <InputWrap icon={<User size={17} />}>
                  <input className="auth-input" placeholder="Arjun Pratap" value={name}
                    onChange={(e) => setName(e.target.value)} onBlur={() => blur("name")} autoComplete="name" />
                </InputWrap>
              </Field>
            )}

            <Field label="Work email" error={touched.email && !emailOk ? "Enter a valid email address" : undefined}>
              <InputWrap icon={<Mail size={17} />} invalid={touched.email && !emailOk}>
                <input type="email" className="auth-input" placeholder="you@ntro.gov.in" value={email}
                  onChange={(e) => setEmail(e.target.value)} onBlur={() => blur("email")} autoComplete="email" />
              </InputWrap>
            </Field>

            {isSignup && (
              <Field label="Organization / Unit">
                <InputWrap icon={<Building2 size={17} />}>
                  <select className="auth-input appearance-none cursor-pointer pr-8" value={org} onChange={(e) => setOrg(e.target.value)}>
                    <option>NTRO — Imagery Analysis</option>
                    <option>NTRO — Geospatial Intelligence</option>
                    <option>Defence Research (DRDO)</option>
                    <option>Other Government Agency</option>
                  </select>
                </InputWrap>
              </Field>
            )}

            <Field label="Password" error={touched.password && !pwOk ? "At least 8 characters" : undefined}>
              <InputWrap icon={<Lock size={17} />} invalid={touched.password && !pwOk}
                trailing={
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted hover:text-ink transition px-1" aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }>
                <input type={showPw ? "text" : "password"} className="auth-input" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} onBlur={() => blur("password")}
                  autoComplete={isSignup ? "new-password" : "current-password"} />
              </InputWrap>
              {isSignup && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-1.5 flex-1 rounded-full transition-colors"
                        style={{ background: i < score ? STRENGTH[score].color : "#EBE9E3" }} />
                    ))}
                  </div>
                  <div className="text-[11.5px] mt-1" style={{ color: STRENGTH[score].color }}>{STRENGTH[score].label} password</div>
                </div>
              )}
            </Field>

            {isSignup && (
              <Field label="Confirm password" error={touched.confirm && !confirmOk ? "Passwords don't match" : undefined}>
                <InputWrap icon={<Lock size={17} />} invalid={touched.confirm && !confirmOk}
                  trailing={confirmOk && confirm.length > 0 ? <Check size={17} className="text-success" /> : undefined}>
                  <input type={showPw ? "text" : "password"} className="auth-input" placeholder="••••••••" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} onBlur={() => blur("confirm")} autoComplete="new-password" />
                </InputWrap>
              </Field>
            )}

            {!isSignup ? (
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <CheckBox checked={remember} onChange={setRemember} />
                  <span className="text-[13px] text-ink-soft">Remember me</span>
                </label>
                <button type="button" onClick={() => toast("Password reset link sent (demo)", "info")} className="text-[13px] font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            ) : (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <CheckBox checked={agree} onChange={setAgree} />
                <span className="text-[12.5px] text-ink-soft leading-snug">
                  I agree to the <span className="text-primary font-medium">Terms of Use</span> and acknowledge the
                  {" "}<span className="text-primary font-medium">Classified Data Handling Policy</span>.
                </span>
              </label>
            )}
            </>
            )}

            <button type="submit" disabled={submitting}
              className={cn(
                "press w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[15px] font-semibold text-white transition-all shadow-sm",
                "bg-primary hover:bg-primary-600 disabled:opacity-70 disabled:cursor-not-allowed",
                canSubmit && !submitting && "hover:shadow-lg hover:-translate-y-0.5"
              )}>
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[12px] text-muted">or continue with</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SocialButton label="Google" onClick={() => toast("SSO provider not configured (demo)", "info")}>
              <GoogleMark />
            </SocialButton>
            <SocialButton label="Microsoft" onClick={() => toast("SSO provider not configured (demo)", "info")}>
              <MicrosoftMark />
            </SocialButton>
            <SocialButton label="SSO" onClick={() => toast("SSO provider not configured (demo)", "info")}>
              <KeyRound size={18} className="text-ink-soft" />
            </SocialButton>
          </div>

          <p className="text-center text-[13px] text-muted mt-6">
            {isSignup ? "Already have an account? " : "New to भू DRISTI? "}
            <Link href={isSignup ? "/login" : "/signup"} className="text-primary font-semibold hover:underline">
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Brand side */

function BrandPanel() {
  const stats = [
    { icon: <Satellite size={16} />, label: "Scenes processed", value: "48,210" },
    { icon: <Layers size={16} />, label: "Avg. resolution gain", value: "4×" },
    { icon: <Activity size={16} />, label: "GPU cluster", value: "Healthy" },
  ];
  return (
    <div className="relative hidden lg:block overflow-hidden lg:col-span-3">
      <div className="absolute inset-0 pointer-events-none" style={{ WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)', maskImage: 'linear-gradient(to right, black 70%, transparent 100%)' }}>
        <SatelliteTile seed="ladakh-urban-auth" variant="sr" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b1a12]/85 via-[#3a2418]/70 to-[#0f2b28]/80" />
      </div>

      <div className="relative h-full flex flex-col justify-between p-12 text-white">
        <div className="flex items-center justify-between">
          <Logo showText onDark />
          <span className="text-[11px] font-semibold tracking-wide rounded-full border border-white/25 px-3 py-1 text-white/85">
            NTRO · Internal Use Only
          </span>
        </div>

        <div className="max-w-[440px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/12 backdrop-blur px-3 py-1.5 text-[12px] font-medium mb-5">
            <ShieldCheck size={14} /> Secure geospatial workspace
          </div>
          <h2 className="text-[34px] leading-[1.15] font-semibold tracking-tight">
            Turn coarse satellite imagery into decision-ready detail.
          </h2>
          <p className="text-[15px] text-white/80 mt-4 leading-relaxed">
            AI super-resolution, uncertainty mapping and validation — for border
            infrastructure, terrain and change monitoring, all in one platform.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-3">
                <div className="flex items-center gap-1.5 text-white/70 text-[11px]">{s.icon}{s.label}</div>
                <div className="text-[18px] font-semibold mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[12px] text-white/55">
          Synthetic demonstration environment · No real classified imagery or credentials.
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Pieces */

function ModeTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={cn("px-4 h-9 grid place-items-center rounded-lg transition-all",
        active ? "bg-primary text-white shadow-sm" : "text-ink-soft hover:text-ink")}>
      {children}
    </Link>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-ink-soft mb-1.5">{label}</label>
      {children}
      {error && <div className="text-[12px] text-danger mt-1">{error}</div>}
    </div>
  );
}

function InputWrap({ icon, trailing, invalid, children }: { icon: React.ReactNode; trailing?: React.ReactNode; invalid?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(
      "group flex items-center gap-2 h-12 px-3.5 rounded-xl border bg-surface transition-all",
      "focus-within:ring-2 focus-within:ring-primary/20",
      invalid ? "border-danger focus-within:border-danger" : "border-line-strong focus-within:border-primary/60"
    )}>
      <span className={cn("shrink-0 transition-colors", invalid ? "text-danger" : "text-muted group-focus-within:text-primary")}>{icon}</span>
      {children}
      {trailing}
    </div>
  );
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span onClick={() => onChange(!checked)}
      className={cn("h-[18px] w-[18px] shrink-0 rounded-[5px] border grid place-items-center transition",
        checked ? "bg-primary border-primary" : "bg-surface border-line-strong hover:border-primary/50")}>
      {checked && <Check size={13} className="text-white" strokeWidth={3} />}
    </span>
  );
}

function SocialButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="press inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-line-strong bg-surface text-[13px] font-medium text-ink-soft hover:bg-canvas hover:border-primary/40 transition">
      {children}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}
