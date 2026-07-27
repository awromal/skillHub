import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings – Skill Hub Admin" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPassword = String(fd.get("new_password") ?? "");
    const confirm = String(fd.get("confirm_password") ?? "");

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-muted-foreground">Manage your admin account.</p>

      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Change Password</div>
            <div className="text-xs text-muted-foreground">Update your admin login password</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="New Password" name="new_password" type="password" minLength={8} required />
          <Field label="Confirm New Password" name="confirm_password" type="password" required />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground hover:bg-brand-2 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Admin Account</div>
            <div className="text-xs text-muted-foreground">Your login details</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Admin login URL:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
            /auth?tab=admin
          </code>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
      />
    </div>
  );
}
