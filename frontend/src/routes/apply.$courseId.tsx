import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { getCourse, submitApplication } from "@/lib/skillhub.functions";
import { supabase } from "@/integrations/supabase/client";

const courseQ = (id: string) =>
  queryOptions({ queryKey: ["course", id], queryFn: () => getCourse({ data: { id } }) });

export const Route = createFileRoute("/apply/$courseId")({
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(courseQ(params.courseId));
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Apply · ${loaderData?.name ?? "Course"} – Skill Hub` },
      { name: "description", content: `Apply for ${loaderData?.name ?? "this course"} at Skill Hub, SB College.` },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  return (
    <div className="min-h-screen bg-secondary/40">
      <SiteHeader />
      <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
        <ApplyForm />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

function ApplyForm() {
  const { courseId } = Route.useParams();
  const { data: course } = useSuspenseQuery(courseQ(courseId));
  const navigate = useNavigate();
  const submit = useServerFn(submitApplication);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setAuthChecked(true);
    });
  }, []);

  if (!course) return <div className="py-24 text-center">Course not found.</div>;
  if (!authChecked) return <div className="py-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" /></div>;
  if (!signedIn) {
    const nextPath = `/apply/${courseId}`;
    return (
      <section className="mx-auto max-w-xl px-4 py-16 md:px-8">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-brand">Sign in to apply</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a free student account or sign in to apply for <span className="font-semibold text-foreground">{course.name}</span> and track your applications.
          </p>
          <Link
            to="/auth"
            search={{ next: nextPath, tab: "student" }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground hover:bg-brand-2"
          >
            Sign in / Sign up
          </Link>
        </div>
      </section>
    );
  }


  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const payload = {
        full_name: String(fd.get("full_name") ?? ""),
        admission_number: String(fd.get("admission_number") ?? ""),
        roll_number: String(fd.get("roll_number") ?? ""),
        department: String(fd.get("department") ?? ""),
        semester: String(fd.get("semester") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        gender: String(fd.get("gender") ?? "Other") as "Male" | "Female" | "Other",
        address: String(fd.get("address") ?? ""),
        parent_name: String(fd.get("parent_name") ?? ""),
        parent_phone: String(fd.get("parent_phone") ?? ""),
        course_id: courseId,
      };
      const res = await submit({ data: payload });
      toast.success("Application submitted!");
      await navigate({ to: "/apply/success", search: { id: res.application_id, sent: res.emailSent ? 1 : 0 } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-brand-2 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </Link>
      <div className="mt-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand">Application Form</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Fill in your details to enroll in <span className="font-semibold text-foreground">{course.name}</span>.</p>
          </div>
          <div className="rounded-xl bg-brand-accent/30 px-3.5 py-1.5 sm:px-4 sm:py-2 text-sm">
            <div className="text-[10px] sm:text-xs text-muted-foreground">Course fee</div>
            <div className="font-bold text-brand text-sm sm:text-base">₹{Number(course.fee).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Full Name" name="full_name" required />
          <Field label="Admission Number" name="admission_number" required />
          <Field label="Roll Number" name="roll_number" required />
          <Field label="Department" name="department" required placeholder="e.g. B.Sc Computer Science" />
          <Select label="Semester" name="semester" required options={["1","2","3","4","5","6"]} />
          <Select label="Gender" name="gender" required options={["Male","Female","Other"]} />
          <Field label="Email" name="email" type="email" required />
          <Field label="Mobile Number" name="phone" type="tel" required />
          <Field label="Parent Name" name="parent_name" />
          <Field label="Parent Phone" name="parent_phone" type="tel" />
          <div className="md:col-span-2">
            <Label>Address</Label>
            <textarea
              name="address"
              rows={3}
              className="mt-1 w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Selected Course</Label>
            <input
              readOnly
              value={course.name}
              className="mt-1 w-full rounded-lg border bg-muted p-3 text-sm"
            />
          </div>

          <div className="md:col-span-2 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-5">
            <p className="text-xs text-muted-foreground text-center sm:text-left">By submitting you consent to be contacted about this course.</p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground hover:bg-brand-2 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</label>;
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
      />
    </div>
  );
}

function Select({ label, name, options, required }: { label: string; name: string; options: string[]; required?: boolean }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="mt-1 w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
