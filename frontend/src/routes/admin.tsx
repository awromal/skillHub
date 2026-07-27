import { createFileRoute, Outlet, Link, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { GraduationCap, LayoutDashboard, BookOpen, FileText, LogOut, Loader2, Menu, X, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/skillhub.functions";
import sbSkillHubLogo from "@/assets/sb-skill-hub-logo.png";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin – Skill Hub" },
      { name: "description", content: "Skill Hub admin dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return { isAdmin: false };
      const res = await checkIsAdmin({
        data: { userId: authData.user.id, email: authData.user.email },
      });
      return res;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!isLoading && (error || !data?.isAdmin)) {
      navigate({
        to: "/auth",
        search: { next: pathname, tab: "admin" },
        replace: true,
      });
    }
  }, [isLoading, data, error, navigate, pathname]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { tab: "admin" }, replace: true });
  }

  if (isLoading || error || !data?.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Checking admin authorization…</p>
        </div>
      </div>
    );
  }

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/applications", label: "Applications", icon: FileText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 -translate-x-full bg-brand text-brand-foreground shadow-xl transition-transform md:translate-x-0 ${open ? "translate-x-0" : ""}`}>
        <div className="flex flex-col gap-2 border-b border-white/10 p-4">
          <div className="rounded-xl bg-white p-2.5 shadow-md w-full flex justify-center">
            <img src={sbSkillHubLogo} alt="SB Skill Hub" className="h-12 w-auto object-contain" />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-brand-accent text-center">Admin Dashboard</div>
        </div>
        <nav className="p-3">
          {links.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-white/15 font-semibold" : "hover:bg-white/10"}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="absolute bottom-4 left-3 right-3 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold hover:bg-white/20">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setOpen(false)} />}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/80 px-3 sm:px-4 py-3 backdrop-blur md:px-6">
          <button className="rounded-lg p-2 hover:bg-accent md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-[160px] sm:max-w-none">Signed in as admin</div>
          <Link to="/" className="text-xs sm:text-sm font-medium text-brand-2 hover:underline">View site →</Link>
        </header>
        <main className="p-3.5 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
