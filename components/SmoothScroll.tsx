"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reducedMotion, stage } from "@/lib/stage";

export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (reducedMotion()) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9 });
    stage.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      stage.lenis = null;
    };
  }, []);
  return null;
}
