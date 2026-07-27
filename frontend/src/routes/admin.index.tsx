import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, CalendarCheck, TrendingUp } from "lucide-react";
import { dashboardStats, listApplications } from "@/lib/skillhub.functions";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["dash-stats"], queryFn: () => dashboardStats() });
  const { data: apps } = useQuery({ queryKey: ["admin-apps"], queryFn: () => listApplications() });
  const recent = apps?.slice(0, 5) ?? [];

  const cards = [
    { icon: BookOpen, label: "Total Courses", value: stats?.totalCourses ?? "—", color: "from-brand to-brand-2" },
    { icon: FileText, label: "Total Applications", value: stats?.totalApplications ?? "—", color: "from-brand-2 to-brand" },
    { icon: CalendarCheck, label: "Today", value: stats?.applicationsToday ?? "—", color: "from-brand-accent to-brand-accent" },
    { icon: TrendingUp, label: "Active Now", value: "Live", color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Overview of Skill Hub activity.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-5 text-white shadow-sm`}>
            <c.icon className="h-6 w-6 opacity-90" />
            <div className="mt-4 text-3xl font-bold">{c.value}</div>
            <div className="text-sm opacity-90">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Recent Applications</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3">App ID</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Course</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No applications yet.</td></tr>
              ) : recent.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-3 pr-3 font-mono text-brand-2">{a.application_id}</td>
                  <td className="py-3 pr-3 font-medium">{a.full_name}</td>
                  <td className="py-3 pr-3">{a.course_name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{a.email}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
