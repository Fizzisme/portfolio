import type Lenis from "lenis";

/** Shared mutable state. Nothing here triggers a React render. */
export const stage = {
  audioLevel: 0,
  station: 0,
  lenis: null as Lenis | null,
  /** True while the page is being scrolled for the visitor (nav links), so nothing interrupts it. */
  autoScroll: false,
};

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.dispatchEvent(new CustomEvent("portfolio:room-request", { detail: id }));
  // a pinned section scrolls to its spacer, which keeps its place in the flow
  const target = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
  // rooms start under the fixed header
  const offset = el.classList.contains("room") ? -64 : 0;
  if (stage.lenis) {
    stage.autoScroll = true;
    stage.lenis.scrollTo(target, { duration: 1.6, offset, onComplete: () => (stage.autoScroll = false) });
  }
  else target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
}
