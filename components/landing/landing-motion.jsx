"use client";

import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector(".ks-nav");
    const revealItems = document.querySelectorAll("[data-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateNav = () => {
      nav?.classList.toggle("ks-nav-scrolled", window.scrollY > 24);
    };

    root.classList.add("ks-motion-ready");
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("ks-in-view"));
      return () => {
        root.classList.remove("ks-motion-ready");
        window.removeEventListener("scroll", updateNav);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("ks-in-view");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      root.classList.remove("ks-motion-ready");
      observer.disconnect();
      window.removeEventListener("scroll", updateNav);
    };
  }, []);

  return null;
}
