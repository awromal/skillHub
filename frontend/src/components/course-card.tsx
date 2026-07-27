import { Link } from "@tanstack/react-router";
import { Calendar, Clock, IndianRupee, User, Users } from "lucide-react";

export interface CourseCardProps {
  id: string;
  name: string;
  description: string;
  duration: string;
  fee: number;
  trainer: string;
  seats: number;
  start_date: string | null;
  image_url: string | null;
}

export function CourseCard(c: CourseCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {c.image_url ? (
          <img
            src={c.image_url}
            alt={c.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-brand/10 text-brand">No image</div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold text-[hsl(30,80%,20%)]">
          {c.seats} seats
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-brand">{c.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex min-w-0 items-center gap-1.5 text-foreground/80"><Clock className="h-3.5 w-3.5 shrink-0 text-brand-2" /><span className="truncate">{c.duration}</span></div>
          <div className="flex min-w-0 items-center gap-1.5 text-foreground/80"><IndianRupee className="h-3.5 w-3.5 shrink-0 text-brand-2" /><span className="truncate">₹{c.fee.toLocaleString("en-IN")}</span></div>
          <div className="flex min-w-0 items-center gap-1.5 text-foreground/80"><User className="h-3.5 w-3.5 shrink-0 text-brand-2" /><span className="truncate">{c.trainer || "TBA"}</span></div>
          <div className="flex min-w-0 items-center gap-1.5 text-foreground/80"><Calendar className="h-3.5 w-3.5 shrink-0 text-brand-2" /><span className="truncate">{c.start_date ? new Date(c.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "TBA"}</span></div>
        </dl>
        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Open</span>
          <Link
            to="/apply/$courseId"
            params={{ courseId: c.id }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-2"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </article>
  );
}
