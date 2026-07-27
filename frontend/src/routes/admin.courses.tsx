import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, ImageIcon, Calendar, Clock,
  IndianRupee, Users, User, BookOpen, ArrowLeft,
} from "lucide-react";
import { listAllCourses, upsertCourse, deleteCourse, toggleCourseStatus } from "@/lib/skillhub.functions";

type CourseRow = Awaited<ReturnType<typeof listAllCourses>>[number];

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => listAllCourses(),
  });
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CourseRow | "new" | null>(null);
  const del = useServerFn(deleteCourse);
  const toggle = useServerFn(toggleCourseStatus);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await del({ data: { id } });
      toast.success("Course deleted");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["public-courses"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleToggle(c: CourseRow) {
    try {
      await toggle({ data: { id: c.id, status: c.status === "active" ? "inactive" : "active" } });
      toast.success(c.status === "active" ? "Course deactivated" : "Course activated");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["public-courses"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  /* ---------- Editor open ---------- */
  if (editing !== null) {
    return (
      <CourseEditor
        initial={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin-courses"] });
          qc.invalidateQueries({ queryKey: ["public-courses"] });
        }}
      />
    );
  }

  /* ---------- Course list ---------- */
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? "s" : ""} · {courses.filter(c => c.status === "active").length} active
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Plus className="h-4 w-4" /> New Course
        </button>
      </div>

      {/* Grid of course cards */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full rounded-2xl border bg-card p-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-semibold text-muted-foreground">No courses yet.</p>
            <button
              onClick={() => setEditing("new")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground"
            >
              <Plus className="h-4 w-4" /> Create first course
            </button>
          </div>
        ) : courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            onEdit={() => setEditing(c)}
            onDelete={() => handleDelete(c.id, c.name)}
            onToggle={() => handleToggle(c)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Course Card ─────────────────────────── */
function CourseCard({
  course: c,
  onEdit,
  onDelete,
  onToggle,
}: {
  course: CourseRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {c.image_url ? (
          <img
            src={c.image_url}
            alt={c.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-brand/5">
            <ImageIcon className="h-10 w-10 text-brand/20" />
          </div>
        )}
        {/* Status badge */}
        <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${c.status === "active" ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"}`}>
          {c.status === "active" ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-brand line-clamp-1">{c.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description || "No description"}</p>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <Chip icon={IndianRupee} label={`₹${Number(c.fee).toLocaleString("en-IN")}`} />
          <Chip icon={Clock} label={c.duration || "—"} />
          <Chip icon={User} label={c.trainer || "—"} />
          <Chip icon={Users} label={`${c.seats} seats`} />
          {c.start_date && <Chip icon={Calendar} label={new Date(c.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />}
        </dl>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t pt-3">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand/10 px-3 py-2 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            title={c.status === "active" ? "Deactivate" : "Activate"}
            onClick={onToggle}
            className="rounded-lg border p-2 transition hover:bg-accent"
          >
            {c.status === "active"
              ? <ToggleRight className="h-4 w-4 text-emerald-600" />
              : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button
            title="Delete course"
            onClick={onDelete}
            className="rounded-lg border p-2 text-destructive transition hover:bg-destructive hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1 text-foreground/70">
      <Icon className="h-3 w-3 shrink-0 text-brand-2" />
      <span className="truncate">{label}</span>
    </div>
  );
}

/* ─────────────────────────── Full-page Course Editor ─────────────────────────── */
function CourseEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: CourseRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertCourse);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(initial?.image_url ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await save({
        data: {
          id: initial?.id,
          name: String(fd.get("name")),
          description: String(fd.get("description") ?? ""),
          duration: String(fd.get("duration") ?? ""),
          fee: Number(fd.get("fee") ?? 0),
          trainer: String(fd.get("trainer") ?? ""),
          seats: Number(fd.get("seats") ?? 0),
          start_date: (String(fd.get("start_date") ?? "") || null),
          image_url: (String(fd.get("image_url") ?? "") || null),
          status: (String(fd.get("status") ?? "active") as "active" | "inactive"),
        },
      });
      toast.success(initial ? "Course updated!" : "Course created!");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <div>
      {/* Back header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">{initial ? "Edit Course" : "New Course"}</h1>
          <p className="text-sm text-muted-foreground">
            {initial ? `Editing: ${initial.name}` : "Fill in the details to create a new course."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Left: Main details ── */}
          <div className="space-y-5">

            {/* Course name */}
            <Card title="Course Info">
              <Field label="Course Name" name="name" required defaultValue={initial?.name} placeholder="e.g. Full Stack Web Development" />
              <div className="mt-4">
                <label className="label">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={initial?.description ?? ""}
                  placeholder="What will students learn? What are the prerequisites?"
                  className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2 resize-none"
                />
              </div>
            </Card>

            {/* Schedule & trainer */}
            <Card title="Schedule & Trainer">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Trainer Name" name="trainer" defaultValue={initial?.trainer} placeholder="e.g. Dr. John Thomas" />
                <Field label="Duration" name="duration" defaultValue={initial?.duration} placeholder="e.g. 8 weeks" />
                <Field label="Start Date" name="start_date" type="date" defaultValue={initial?.start_date ?? ""} />
                <Field label="Available Seats" name="seats" type="number" required defaultValue={initial?.seats ?? 30} />
              </div>
            </Card>

            {/* Pricing */}
            <Card title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Course Fee (₹)" name="fee" type="number" required defaultValue={initial?.fee ?? 0} placeholder="0" />
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    defaultValue={initial?.status ?? "active"}
                    className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
                  >
                    <option value="active">🟢 Active — visible to students</option>
                    <option value="inactive">⚫ Inactive — hidden from students</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Right: Image + actions ── */}
          <div className="space-y-5">
            {/* Image preview */}
            <Card title="Course Image">
              <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={() => setImagePreview("")} />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground/40">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-10 w-10" />
                      <p className="mt-2 text-xs">Paste an image URL below</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <label className="label">Image URL</label>
                <input
                  name="image_url"
                  type="url"
                  defaultValue={initial?.image_url ?? ""}
                  placeholder="https://images.unsplash.com/…"
                  onChange={(e) => setImagePreview(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Use{" "}
                  <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="text-brand-2 hover:underline">Unsplash</a>
                  {" "}for free images. Paste a direct image URL.
                </p>
              </div>
            </Card>

            {/* Save actions */}
            <Card title="Actions">
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 py-3 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : initial ? "Save Changes" : "Create Course"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition hover:bg-accent"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>

              {initial && (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive font-semibold mb-2">Danger Zone</p>
                  <Link
                    to="/admin/courses"
                    className="text-xs text-destructive hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                    }}
                  >
                    ← Back without saving
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────── Shared UI ─────────────────────────── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label, name, type = "text", required, defaultValue, placeholder,
}: {
  label: string; name: string; type?: string; required?: boolean;
  defaultValue?: string | number | null; placeholder?: string;
}) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2"
      />
    </div>
  );
}
