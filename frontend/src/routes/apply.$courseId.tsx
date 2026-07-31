import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, Check } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { getCourse, submitApplication, getLatestApplication, checkHasApplied } from "@/lib/skillhub.functions";
import { supabase } from "@/integrations/supabase/client";
import disposableDomains from "disposable-email-domains";

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
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
      setAuthChecked(true);
    });
  }, []);

  const { data: prevApp } = useQuery({
    queryKey: ["latest-application"],
    queryFn: () => getLatestApplication(),
    enabled: signedIn,
  });

  const { data: applyStatus } = useQuery({
    queryKey: ["has-applied", courseId],
    queryFn: () => checkHasApplied({ data: { courseId } }),
    enabled: signedIn,
  });

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

  if (applyStatus?.hasApplied) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 md:px-8 text-center">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
             <Check className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Already Applied</h1>
          <p className="mt-2 text-sm text-muted-foreground">You have already submitted an application for <span className="font-semibold">{course.name}</span>.</p>
          <Link to="/my-applications" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-2">
            View My Applications
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
      const email = String(fd.get("email") ?? "").trim();
      
      const phone = String(fd.get("phone") ?? "").trim();
      if (!/^\d{10}$/.test(phone)) {
        toast.error("Mobile number must be exactly 10 digits.");
        setSubmitting(false);
        return;
      }

      const admission_number = String(fd.get("admission_number") ?? "").trim();
      if (!/^\d{8}$/.test(admission_number)) {
        toast.error("Admission number must be exactly 8 digits.");
        setSubmitting(false);
        return;
      }

      const roll_number = String(fd.get("roll_number") ?? "").trim();
      if (!/^\d{4}$/.test(roll_number)) {
        toast.error("Roll number must be exactly 4 digits.");
        setSubmitting(false);
        return;
      }

      const payload = {
        full_name: String(fd.get("full_name") ?? ""),
        admission_number,
        roll_number,
        department: String(fd.get("department") ?? ""),
        semester: String(fd.get("semester") ?? ""),
        email,
        phone,
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

        <form key={prevApp?.id ?? "new"} onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Full Name" name="full_name" required defaultValue={prevApp?.full_name} />
          <Field label="Admission Number" name="admission_number" required pattern="\d{8}" title="Admission Number must be exactly 8 digits" maxLength={8} defaultValue={prevApp?.admission_number} />
          <Field label="Roll Number" name="roll_number" required pattern="\d{4}" title="Roll Number must be exactly 4 digits" maxLength={4} defaultValue={prevApp?.roll_number} />
          <Field label="Department" name="department" required placeholder="e.g. B.Sc Computer Science" defaultValue={prevApp?.department} />
          <Select label="Semester" name="semester" required options={["1","2","3","4","5","6"]} defaultValue={prevApp?.semester} />
          <Select label="Gender" name="gender" required options={["Male","Female","Other"]} defaultValue={prevApp?.gender} />
          <Field label="Email" name="email" type="email" required value={userEmail} readOnly />
          <Field label="Mobile Number" name="phone" type="tel" required pattern="\d{10}" title="Mobile Number must be exactly 10 digits" maxLength={10} defaultValue={prevApp?.phone} />
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

function Field({ label, name, type = "text", required, placeholder, pattern, title, maxLength, value, defaultValue, readOnly }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; pattern?: string; title?: string; maxLength?: number; value?: string; defaultValue?: string; readOnly?: boolean }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        title={title}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={`mt-1 w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2 ${readOnly ? "opacity-70 bg-muted cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

function Select({ label, name, options, required, defaultValue }: { label: string; name: string; options: string[]; required?: boolean; defaultValue?: string }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue || ""}
        className="mt-1 w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
