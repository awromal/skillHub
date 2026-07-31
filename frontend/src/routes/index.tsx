import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { GraduationCap, Sparkles, Users, Trophy, Rocket, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CourseCard } from "@/components/course-card";
import { listActiveCourses, listMyApplications } from "@/lib/skillhub.functions";
import { useHeroEnter, useRevealChildren, useCountUp } from "@/hooks/use-gsap";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";

const coursesQuery = queryOptions({
  queryKey: ["public-courses"],
  queryFn: () => listActiveCourses(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.ensureQueryData(coursesQuery);
    } catch {
      return [];
    }
  },
  head: () => ({
    meta: [
      { title: "Skill Hub – St. Berchmans College Changanassery" },
      { name: "description", content: "Enroll in career-focused courses – Python, AI, Full Stack, Data Science, UI/UX and more at SB College Skill Hub." },
      { property: "og:title", content: "Skill Hub – SB College" },
      { property: "og:description", content: "Career-focused courses at St. Berchmans College Changanassery." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <About />
      <WhyChoose />
      <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading courses…</div>}>
        <FeaturedCourses />
      </Suspense>
      <ContactCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const ref = useHeroEnter<HTMLDivElement>();
  const cCourses = useCountUp(10);
  const cSeats = useCountUp(300);
  const cCert = useCountUp(100);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-2 text-brand-foreground">
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-brand-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div ref={ref} className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:gap-14 md:px-8 md:py-28 lg:py-32">
        {/* Left col */}
        <div className="flex flex-col justify-center">
          <span data-hero-item className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> St. Berchmans College · Autonomous
          </span>
          <h1 data-hero-item className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            Master real skills.<br />
            <span className="bg-gradient-to-r from-brand-accent via-yellow-200 to-brand-accent bg-clip-text text-transparent">Build a real career.</span>
          </h1>
          <p data-hero-item className="mt-5 max-w-lg text-base leading-relaxed opacity-90 md:text-lg">
            Industry-ready certificate programs in coding, design, AI, and more —
            taught by expert trainers at Skill Hub, SB College Changanassery.
          </p>
          <div data-hero-item className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Link to="/courses" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 text-sm font-bold text-[hsl(30,80%,20%)] shadow-lg shadow-brand-accent/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-accent/40">
              Browse Courses <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a href="#about" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10">
              Learn More
            </a>
          </div>
          <div data-hero-item className="mt-10 grid grid-cols-3 gap-3 sm:flex sm:gap-8 text-sm">
            <div className="rounded-xl bg-white/5 p-2 sm:p-0 backdrop-blur-sm sm:bg-transparent"><div className="text-2xl sm:text-3xl font-extrabold"><span ref={cCourses}>0</span>+</div><div className="mt-0.5 text-xs sm:text-sm opacity-80">Courses</div></div>
            <div className="rounded-xl bg-white/5 p-2 sm:p-0 backdrop-blur-sm sm:bg-transparent"><div className="text-2xl sm:text-3xl font-extrabold"><span ref={cSeats}>0</span>+</div><div className="mt-0.5 text-xs sm:text-sm opacity-80">Seats</div></div>
            <div className="rounded-xl bg-white/5 p-2 sm:p-0 backdrop-blur-sm sm:bg-transparent"><div className="text-2xl sm:text-3xl font-extrabold"><span ref={cCert}>0</span>%</div><div className="mt-0.5 text-xs sm:text-sm opacity-80">Certified</div></div>
          </div>
        </div>

        {/* Right col — image (hidden on mobile) */}
        <div className="relative hidden md:flex md:items-center" data-hero-image>
          <div className="absolute inset-0 -m-6 rounded-[2rem] bg-gradient-to-br from-brand-accent/40 to-transparent blur-3xl" />
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80"
            alt="Students at Skill Hub"
            className="relative w-full rounded-3xl shadow-2xl ring-1 ring-white/20 object-cover"
          />
          <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Placements</div>
                <div className="text-sm font-bold text-brand">Industry-recognized</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider into white bg */}
      <div className="relative -mb-px">
        <svg viewBox="0 0 1440 60" className="w-full fill-background" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-2">About Skill Hub</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">Bridging academics<br className="hidden sm:block" /> and industry.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Skill Hub at St. Berchmans College is our flagship skill-development
            initiative. Beyond the classroom, students earn certifications in
            technologies employers actually hire for — from full-stack development
            and data science to design and cybersecurity.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Hands-on projects, real portfolios",
              "Trainers from leading industries",
              "Certificate on completion",
              "Affordable, on-campus scheduling",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-accent text-[hsl(30,80%,20%)] text-[10px] font-bold">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: GraduationCap, k: "Expert Trainers", v: "Industry veterans" },
            { icon: Users, k: "Small Batches", v: "Personal attention" },
            { icon: Trophy, k: "Certification", v: "Recognized credential" },
            { icon: Rocket, k: "Career Ready", v: "Placement support" },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{k}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section className="bg-secondary/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-2">Why choose us</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">The Skill Hub.</h2>
          <p className="mt-3 text-sm text-muted-foreground">Everything you need to upskill — without leaving campus.</p>
        </div>
        <WhyGrid />
      </div>
    </section>
  );
}

function WhyGrid() {
  const ref = useRevealChildren<HTMLDivElement>(":scope > *", { stagger: 0.12, y: 40 });
  return (
    <div ref={ref} className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {[
        { t: "Affordable Fees", d: "Quality education at a fraction of private-institute pricing.", emoji: "💰" },
        { t: "Modern Curriculum", d: "Updated every semester to match industry expectations.", emoji: "📚" },
        { t: "On-Campus Convenience", d: "Attend after regular classes without commuting anywhere.", emoji: "🏫" },
      ].map((c) => (
        <div key={c.t} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/50 transition hover:-translate-y-1 hover:shadow-xl">
          <div className="text-3xl">{c.emoji}</div>
          <div>
            <div className="text-lg font-bold text-brand">{c.t}</div>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedCourses() {
  const { data: courses = [] } = useQuery(coursesQuery);
  const featured = courses.slice(0, 6);

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

  // Don't render the section at all if there are no courses
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 pb-10 md:px-8 md:pt-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-2">Available Courses</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Pick your next skill.</h2>
        </div>
        <Link to="/courses" className="text-sm font-semibold text-brand-2 hover:underline">View all →</Link>
      </div>
      <FeaturedGrid featured={featured} appliedIds={appliedIds} />
    </section>
  );
}

function FeaturedGrid({ featured, appliedIds }: { featured: Awaited<ReturnType<typeof listActiveCourses>>, appliedIds: Set<string> }) {
  const ref = useRevealChildren<HTMLDivElement>(":scope > *", { stagger: 0.09, y: 36 });
  return (
    <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((c) => (
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

function ContactCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 md:px-8 md:pb-20 md:pt-6">
      <div className="rounded-3xl bg-gradient-to-br from-brand to-brand-2 px-8 py-10 text-brand-foreground shadow-xl md:px-14 md:py-14">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Ready to level up?</h2>
            <p className="mt-3 text-base opacity-90 max-w-lg">Applications are open. Reserve your seat today — no hassle, just skills.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3 text-sm font-bold text-[hsl(30,80%,20%)] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:brightness-105"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
