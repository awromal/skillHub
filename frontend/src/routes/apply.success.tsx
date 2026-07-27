import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Mail } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

const search = z.object({
  id: z.string().default(""),
  sent: z.coerce.number().default(0),
});

export const Route = createFileRoute("/apply/success")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Application Submitted – Skill Hub" },
      { name: "description", content: "Your Skill Hub application was received." },
    ],
  }),
  component: Success,
});

function Success() {
  const { id, sent } = Route.useSearch();
  return (
    <div className="min-h-screen bg-secondary/40">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-accent/40">
            <CheckCircle2 className="h-12 w-12 text-brand" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-brand">Application Received!</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you for applying to Skill Hub. Our team will get back to you shortly.
          </p>
          <div className="mt-6 rounded-2xl bg-muted p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Your Application ID</div>
            <div className="mt-1 text-2xl font-mono font-bold text-brand-2">{id}</div>
          </div>
          {sent === 1 ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
              <Mail className="h-4 w-4" /> A confirmation email is on its way.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Please save this ID — you'll need it for follow-up.
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/courses" className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-accent">
              Browse more courses
            </Link>
            <Link to="/" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-2">
              Return home
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
