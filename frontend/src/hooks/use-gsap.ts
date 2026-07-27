import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Fade + rise reveal on scroll for all direct children of the returned ref target. */
export function useRevealChildren<T extends HTMLElement = HTMLElement>(
  selector: string = ":scope > *",
  opts: { stagger?: number; y?: number; duration?: number } = {},
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const targets = Array.from(el.querySelectorAll(selector)) as HTMLElement[];
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y: opts.y ?? 32,
        duration: opts.duration ?? 0.7,
        ease: "power3.out",
        stagger: opts.stagger ?? 0.08,
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: "top 95%",
          toggleActions: "play none none none",
          once: true,
        },
      });
    }, el);
    return () => ctx.revert();
  }, [selector, opts.stagger, opts.y, opts.duration]);
  return ref;
}

/** Hero entrance — heavier, one-shot on mount, no ScrollTrigger. */
export function useHeroEnter<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(el.querySelectorAll("[data-hero-item]"), {
        opacity: 0,
        y: 40,
        duration: 0.9,
        stagger: 0.12,
      });
      tl.from(el.querySelectorAll("[data-hero-image]"), {
        opacity: 0,
        scale: 0.95,
        duration: 1.1,
        ease: "expo.out",
      }, "-=0.7");
    }, el);
    return () => ctx.revert();
  }, []);
  return ref;
}

/** Animated count-up when element scrolls into view. */
export function useCountUp(target: number, opts: { duration?: number } = {}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: target,
        duration: opts.duration ?? 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v).toString(); },
      });
    });
    return () => ctx.revert();
  }, [target, opts.duration]);
  return ref;
}
