"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { imageAsset } from "@/lib/image-assets";

/** A short opening while the first page finishes loading, with a timeout for slow assets. */
export function Preloader() {
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase === "done") window.dispatchEvent(new Event("portfolio:opening-ready"));
  }, [phase]);

  useEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload") {
      setPhase("done");
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = Date.now();
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    let cancelled = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const delay = reduced ? 0 : Math.max(0, 600 - (Date.now() - started));
      exitTimer = setTimeout(() => {
        setProgress(100);
        removeTimer = setTimeout(() => {
          setPhase("leaving");
          removeTimer = setTimeout(() => setPhase("done"), reduced ? 0 : 550);
        }, reduced ? 0 : 120);
      }, delay);
    };

    // Count critical images that have decoded, not unrelated page resources or simulated bytes.
    const critical = Array.from(document.querySelectorAll<HTMLImageElement>(".preloader img, .hero-img"));
    let decoded = 0;
    void Promise.all(critical.map(async (image) => {
      try { await image.decode(); } catch { /* A failed asset must not trap the visitor. */ }
      if (!cancelled && !finished) setProgress(Math.round((++decoded / critical.length) * 95));
    })).then(() => { if (!cancelled) finish(); });
    const fallback = setTimeout(finish, 3000);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className="preloader" data-phase={phase} role="status" aria-label="Loading portfolio" style={{ "--preloader-progress": progress / 100 } as CSSProperties}>
      <div className="preloader-inner" aria-hidden="true">
        <div className="preloader-top"><span>FIZZ / PORTFOLIO</span><span>SOFTWARE &amp; AI ENGINEER</span></div>
        <div className="preloader-center">
          <div className="preloader-ticket">
            <Image className="preloader-ticket-art" src={imageAsset("/preloader/ticket.png")} width={2172} height={724} alt="" preload unoptimized />
            <span className="preloader-percent" data-complete={progress === 100}>{progress}%</span>
            <div className="preloader-ticket-track"><span /></div>
          </div>
          <Image className="preloader-message" src={imageAsset("/preloader/message.png")} width={2172} height={724} alt="" preload unoptimized />
        </div>
        <div className="preloader-bottom">
          <div className="preloader-loading"><span>PLEIKU, VIETNAM</span><span>PLEASE WAIT</span></div>
          <div className="preloader-track"><span /></div>
        </div>
      </div>
    </div>
  );
}
