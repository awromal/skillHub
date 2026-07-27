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
  const isAdmin = search.tab === "admin";

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
          {/* Tab Switcher */}
          <div className="mb-6 flex rounded-xl bg-secondary p-1">
            <Link
              to="/auth"
              search={(s) => ({ ...s, tab: undefined })}
              className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition ${
                !isAdmin ? "bg-background text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Student Sign in
            </Link>
            <Link
              to="/auth"
              search={(s) => ({ ...s, tab: "admin" })}
              className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition ${
                isAdmin ? "bg-background text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admin Sign in
            </Link>
          </div>

          {isAdmin ? <AdminPane /> : <StudentPane next={search.next} />}
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
    <form onSubmit={onSubmit} className="space-y-3">
      <TextInput name="email" type="email" label="Email" required autoComplete="email" />
      <TextInput name="password" type="password" label="Password" required autoComplete="current-password" />
      <PrimaryButton loading={loading}>Sign in</PrimaryButton>
    </form>
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
    <form onSubmit={onSubmit} className="space-y-3">
      <TextInput name="email" type="email" label="Email" required autoComplete="email" />
      <TextInput name="password" type="password" label="Password (min 8 chars)" required minLength={8} autoComplete="new-password" />
      <PrimaryButton loading={loading}>Create account</PrimaryButton>
    </form>
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
        <TextInput name="email" type="email" label="Email" required autoComplete="email" defaultValue="sbadmin@gmail.com" />
        <TextInput name="password" type="password" label="Password" required autoComplete="current-password" defaultValue="adminsb@sb" />
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
