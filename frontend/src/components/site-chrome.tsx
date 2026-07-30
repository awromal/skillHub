import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, User as UserIcon, ChevronDown, GraduationCap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import sbCrest from "@/assets/sb-college-crest.png";
import sbSkillHubLogo from "@/assets/sb-skill-hub-logo.png";

function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return user;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const user = useSessionUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/courses", label: "Courses" },
    { to: "/#about", label: "About" },
    { to: "/#contact", label: "Contact" },
  ];

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to.replace("/#", "/"));

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-white/80 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">

        {/* ── Brand ── */}
        <Link to="/" className="group flex items-center py-1">
          <img
            src={sbSkillHubLogo}
            alt="SB Skill Hub - Centre For Upskilling Initiatives"
            className="h-10 sm:h-12 md:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] drop-shadow-sm"
          />
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(l.to)
                  ? "text-brand"
                  : "text-foreground/70 hover:text-brand"
              }`}
            >
              {isActive(l.to) && (
                <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-brand" />
              )}
              {l.label}
            </a>
          ))}

          {/* Divider */}
          <div className="mx-2 h-5 w-px bg-border" />

          {user ? (
            <div className="flex items-center gap-1.5">

              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : null}

          <Link
            to="/courses"
            className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand/20 transition hover:-translate-y-px hover:bg-brand-2 hover:shadow-lg"
          >
            Apply Now
          </Link>
        </nav>

        {/* ── Mobile hamburger ── */}
        <button
          className="rounded-lg p-2 text-foreground/70 hover:bg-accent md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div className="border-t bg-white/95 backdrop-blur-md md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 p-3">
            {navLinks.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive(l.to)
                    ? "bg-brand/10 text-brand font-bold"
                    : "hover:bg-accent"
                }`}
              >
                {l.label}
              </a>
            ))}

            {user && (
              <>
                <div className="my-1.5 border-t" />

                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <LogOut className="h-4 w-4 text-destructive" /> Sign out
                </button>
              </>
            )}

            <div className="mt-2">
              <Link
                to="/courses"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-md"
              >
                Apply Now
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-brand text-brand-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">

        {/* Brand col */}
        <div>
          <div className="rounded-2xl bg-white p-3 sm:p-4 inline-block shadow-lg">
            <img src={sbSkillHubLogo} alt="SB Skill Hub" className="h-14 sm:h-20 w-auto object-contain" />
          </div>
          <p className="mt-4 text-sm leading-relaxed opacity-75">
            Career-focused skill training for students of St. Berchmans College and beyond.
          </p>
          <div className="mt-5 flex items-center gap-1 text-xs opacity-50">
            <GraduationCap className="h-3.5 w-3.5" />
            St. Berchmans College · Autonomous · NAAC A+
          </div>
        </div>

        {/* Contact col */}
        <div id="contact">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest opacity-60">Contact</div>
          <ul className="space-y-2.5 text-sm opacity-85">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-brand-accent">📍</span>
              <a href="https://maps.google.com/?q=SB+College,+Changanassery,+Kerala+686101" target="_blank" rel="noopener noreferrer" className="hover:underline hover:opacity-100 transition">
                SB College, Changanassery, Kerala 686101
              </a>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-brand-accent">✉️</span>
              <a href="mailto:skillhubsb@gmail.com" className="hover:underline hover:opacity-100 transition">skillhubsb@gmail.com</a>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-brand-accent">📞</span>
              <a href="tel:+919961231314" className="hover:underline hover:opacity-100 transition">+91 99612 31314</a>
            </li>
          </ul>
        </div>

        {/* Links col */}
        <div>
          <div className="mb-4 text-xs font-bold uppercase tracking-widest opacity-60">Quick Links</div>
          <ul className="space-y-2.5 text-sm opacity-85">
            {[
              { href: "/courses", label: "Browse Courses" },
              { href: "/#about", label: "About Skill Hub" },
              { href: "/auth", label: "Student Login" },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex items-center gap-1.5 hover:opacity-100 hover:underline underline-offset-4 opacity-80 transition">
                  <ChevronDown className="h-3 w-3 -rotate-90 text-brand-accent" />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs opacity-50">
        © {new Date().getFullYear()} St. Berchmans College · Skill Hub. All rights reserved.
      </div>
    </footer>
  );
}
