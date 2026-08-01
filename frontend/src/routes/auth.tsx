import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { seedDefaultAdmin } from "@/lib/admin-setup.functions";
import { createStudentAccount } from "@/lib/skillhub.functions";
import sbCrest from "@/assets/sb-college-crest.png";
import sbSkillHubLogo from "@/assets/sb-skill-hub-logo.png";

const searchSchema = z.object({
  next: z.string().optional(),
  tab: z.enum(["student", "admin"]).optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign In – Skill Hub" },
      { name: "description", content: "Sign in to Skill Hub as a student or administrator." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const isAdmin = search.tab === "admin";

  const handleTabChange = (tab: "student" | "admin") => {
    navigate({
      to: "/auth",
      search: { ...search, tab },
      replace: true,
    });
  };

  return (
    <div className="grid min-h-screen bg-gradient-to-br from-brand via-brand to-brand-2 place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-6 flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-2xl ring-1 ring-white/20 transition hover:scale-105">
            <img src={sbSkillHubLogo} alt="SB Skill Hub" className="h-14 sm:h-20 md:h-24 w-auto object-contain" />
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-white/90 text-center">St. Berchmans College · Changanassery</p>
        </Link>

        <div className="rounded-2xl bg-card p-4 sm:p-6 shadow-2xl ring-1 ring-white/10">
          {/* Tab Navigation for Student vs Admin */}
          <div className="mb-6 flex rounded-xl bg-muted p-1 border border-border/50">
            <button
              type="button"
              onClick={() => handleTabChange("student")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm transition-all ${
                !isAdmin
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-brand" />
              Student Login
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("admin")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm transition-all ${
                isAdmin
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-brand-2" />
              Admin Login
            </button>
          </div>

          {isAdmin ? <AdminPane /> : <StudentPane next={search.next} />}
        </div>

        <div className="mt-4 text-center text-xs text-white/80">
          {!isAdmin ? (
            <p>
              Are you an administrator?{" "}
              <button
                type="button"
                onClick={() => handleTabChange("admin")}
                className="font-bold underline text-white hover:text-white/90 cursor-pointer"
              >
                Sign in as Admin
              </button>
            </p>
          ) : (
            <p>
              Are you a student?{" "}
              <button
                type="button"
                onClick={() => handleTabChange("student")}
                className="font-bold underline text-white hover:text-white/90 cursor-pointer"
              >
                Sign in as Student
              </button>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} SB Skill Hub
        </p>
      </div>
    </div>
  );
}

/* ------------------ Student ------------------ */
function StudentPane({ next }: { next?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-brand-2" />
        <h2 className="text-lg font-bold">{mode === "signin" ? "Student Sign in" : "Create Student Account"}</h2>
      </div>
      {mode === "signin" ? <StudentSignIn next={next} /> : <StudentSignUp next={next} onDone={() => setMode("signin")} />}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "signin" ? "New student?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-semibold text-brand-2 hover:underline"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </>
  );
}

async function handleGoogleSignIn(next?: string) {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://sbskillhub-site.vercel.app";
  const targetPath = next && next.startsWith("/") ? next : "/my-applications";
  const redirectTo = `${origin}${targetPath}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
  if (error) {
    toast.error(error.message);
  }
}

function GoogleButton({ onClick, text = "Sign in with Google" }: { onClick: () => Promise<void> | void; text?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-lg border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{text}</span>
    </button>
  );
}

function OrDivider() {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-muted" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
      </div>
    </div>
  );
}

function StudentSignIn({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    router.invalidate();
    if (next && next.startsWith("/")) navigate({ to: next as "/" });
    else navigate({ to: "/my-applications" });
  }
  return (
    <div>
      <GoogleButton onClick={() => handleGoogleSignIn(next)} text="Sign in with Google" />
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-3">
        <TextInput name="email" type="email" label="Email" required autoComplete="email" />
        <TextInput name="password" type="password" label="Password" required autoComplete="current-password" />
        <PrimaryButton loading={loading}>Sign in</PrimaryButton>
      </form>
    </div>
  );
}

function StudentSignUp({ next, onDone }: { next?: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const createAccount = useServerFn(createStudentAccount);
  const navigate = useNavigate();
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));

    try {
      await createAccount({ data: { email, password } });
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInErr) {
        toast.success("Account created. Please sign in.");
        onDone();
        return;
      }
      toast.success("Account created — signed in.");
      router.invalidate();
      if (next && next.startsWith("/")) navigate({ to: next as "/" });
      else navigate({ to: "/my-applications" });
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message ?? "Account creation failed");
    }
  }
  return (
    <div>
      <GoogleButton onClick={() => handleGoogleSignIn(next)} text="Sign up with Google" />
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-3">
        <TextInput name="email" type="email" label="Email" required autoComplete="email" />
        <TextInput name="password" type="password" label="Password (min 8 chars)" required minLength={8} autoComplete="new-password" />
        <PrimaryButton loading={loading}>Create account</PrimaryButton>
      </form>
    </div>
  );
}

/* ------------------ Admin ------------------ */
function AdminPane() {
  return <AdminLogin />;
}

function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const seedAdmin = useServerFn(seedDefaultAdmin);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));

    // Ensure default admin account exists before signing in
    if (email.toLowerCase() === "sbadmin@gmail.com" || email.toLowerCase().includes("admin")) {
      await seedAdmin().catch(() => {});
    }

    let { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Retry once after seeding if initial login attempt failed
      await seedAdmin().catch(() => {});
      const retry = await supabase.auth.signInWithPassword({ email, password });
      error = retry.error;
    }

    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in successfully");
    router.invalidate();
    navigate({ to: "/admin" });
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-2" />
        <h2 className="text-lg font-bold">Administrator Sign in</h2>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Restricted to Skill Hub staff.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <TextInput name="email" type="email" label="Email" required autoComplete="off" />
        <TextInput name="password" type="password" label="Password" required autoComplete="new-password" />
        <PrimaryButton loading={loading}>Sign in as Admin</PrimaryButton>
      </form>
    </>
  );
}



/* ------------------ Shared ------------------ */
function TextInput({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        {...rest}
        className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-2"
      />
    </div>
  );
}

function PrimaryButton({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={loading}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition hover:bg-brand-2 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
