import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { listMyApplications } from "@/lib/skillhub.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/my-applications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Applications – Skill Hub" },
      { name: "description", content: "Track the courses you have applied for at Skill Hub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyApplicationsPage,
});

function MyApplicationsPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) navigate({ to: "/auth", search: { next: "/my-applications", tab: "student" } });
      else setReady(true);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-secondary/40">
      <SiteHeader />
      <div className="bg-gradient-to-br from-brand to-brand-2 text-brand-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
          <h1 className="text-3xl font-extrabold md:text-4xl">My Applications</h1>
          <p className="mt-2 max-w-xl opacity-90">Track the courses you've applied for at Skill Hub.</p>
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {ready ? <MyList /> : <div className="py-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" /></div>}
      </section>
      <SiteFooter />
    </div>
  );
}

function MyList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => listMyApplications(),
  });
  if (isLoading) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" /></div>;
  if (error) return <div className="rounded-2xl border bg-card p-8 text-center text-destructive">Failed to load applications.</div>;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">You haven't applied to any courses yet.</p>
        <Link to="/courses" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-2">
          <Plus className="h-4 w-4" /> Browse Courses
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {data.map((a) => (
        <div key={a.id} className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-2">{a.application_id}</div>
              <div className="mt-1 text-base sm:text-lg font-bold text-foreground">{a.course_name}</div>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {a.department} · Semester {a.semester}
              </div>
            </div>
            <div className="text-left sm:text-right text-xs text-muted-foreground">
              Applied {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
