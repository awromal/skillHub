import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CourseCard } from "@/components/course-card";
import { listActiveCourses, listMyApplications } from "@/lib/skillhub.functions";
import { useRevealChildren } from "@/hooks/use-gsap";
import { supabase } from "@/integrations/supabase/client";

const coursesQuery = queryOptions({
  queryKey: ["public-courses"],
  queryFn: () => listActiveCourses(),
});

export const Route = createFileRoute("/courses")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.ensureQueryData(coursesQuery);
    } catch {
      return [];
    }
  },
  head: () => ({
    meta: [
      { title: "Courses – Skill Hub | SB College" },
      { name: "description", content: "Browse all Skill Hub courses at St. Berchmans College and apply online." },
      { property: "og:title", content: "Courses – Skill Hub" },
      { property: "og:description", content: "All Skill Hub courses at SB College Changanassery." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-gradient-to-br from-brand to-brand-2 text-brand-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h1 className="text-4xl font-extrabold md:text-5xl">All Courses</h1>
          <p className="mt-3 max-w-xl opacity-90">Explore our full catalog of Skill Hub certificate programs. Apply in minutes — no login needed.</p>
        </div>
      </div>
      <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading courses…</div>}>
        <CoursesGrid />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

function CoursesGrid() {
  const { data: courses = [] } = useQuery(coursesQuery);
  const [signedIn, setSignedIn] = useState(false);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  const { data: myApps = [] } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => listMyApplications(),
    enabled: signedIn,
  });

  const appliedIds = useMemo(() => new Set(myApps.map((a) => a.course_id)), [myApps]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return courses;
    return courses.filter(
      (c) => c.name.toLowerCase().includes(t) || c.description.toLowerCase().includes(t) || c.trainer.toLowerCase().includes(t),
    );
  }, [courses, q]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="text-sm text-muted-foreground">{filtered.length} of {courses.length} courses</div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, trainer…"
            className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card py-20 text-center text-muted-foreground">No courses match your search.</div>
      ) : (
        <RevealGrid courses={filtered} appliedIds={appliedIds} />
      )}
    </section>
  );
}

function RevealGrid({ courses, appliedIds }: { courses: Awaited<ReturnType<typeof listActiveCourses>>, appliedIds: Set<string> }) {
  const ref = useRevealChildren<HTMLDivElement>(":scope > *", { stagger: 0.07, y: 30 });
  return (
    <div ref={ref} key={courses.map((c) => c.id).join(",")} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard
          key={c.id}
          id={c.id}
          name={c.name}
          description={c.description}
          duration={c.duration}
          fee={Number(c.fee)}
          trainer={c.trainer}
          seats={c.seats}
          start_date={c.start_date}
          image_url={c.image_url}
          hasApplied={appliedIds.has(c.id)}
        />
      ))}
    </div>
  );
}
