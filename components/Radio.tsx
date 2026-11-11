"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { lofi, STATIONS } from "@/lib/lofi";
import { stage } from "@/lib/stage";
import { Icon } from "./Icon";

export function useLofi() {
  return useSyncExternalStore(
    (fn) => lofi.subscribe(fn),
    () => `${lofi.playing}|${stage.station}|${lofi.volume}|${lofi.rain}|${lofi.crackle}`,
    () => "false|0|0.7|0.35|true",
  );
}

const BAR = 3;
const GAP = 2;

/** Thin rounded bars fed by the real analyser, with needle-like ballistics. */
export function Visualizer({ bars = 12, height = 18, className, color }: { bars?: number; height?: number; className?: string; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const playing = useLofi().startsWith("true");
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = bars * (BAR + GAP) - GAP;
    c.width = Math.round(w * dpr);
    c.height = Math.round(height * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${height}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const levels = new Float32Array(bars);
    let data: Uint8Array<ArrayBuffer> | null = null;
    const tick = (_t: number, delta: number) => {
      const dt = delta / 1000;
      const a = lofi.analyser;
      if (a && lofi.playing) {
        if (!data || data.length !== a.frequencyBinCount) data = new Uint8Array(a.frequencyBinCount);
        a.getByteFrequencyData(data);
      }
      ctx.clearRect(0, 0, w, height);
      for (let i = 0; i < bars; i++) {
        let target = 0;
        if (data && lofi.playing) {
          // log-spaced bins so the low end doesn't hog every bar
          const lo = Math.floor(Math.pow(i / bars, 1.8) * 70) + 1;
          const hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / bars, 1.8) * 70) + 1);
          let sum = 0;
          for (let b = lo; b < hi; b++) sum += data[b];
          target = (sum / (hi - lo) / 255) * height * 1.15;
        }
        levels[i] =
          target > levels[i] ? levels[i] + (target - levels[i]) * 0.55 : Math.max(target, levels[i] - 24 * (height / 16) * dt);
        const h = Math.min(height, Math.max(BAR, levels[i]));
        ctx.fillStyle = color ?? (h > height * 0.7 ? "#3fc700" : "#262626");
        ctx.beginPath();
        ctx.roundRect(i * (BAR + GAP), height - h, BAR, h, BAR / 2);
        ctx.fill();
      }
    };
    if (playing) gsap.ticker.add(tick);
    else tick(0, 0);
    return () => gsap.ticker.remove(tick);
  }, [bars, height, playing, color]);
  return <canvas ref={ref} className={`viz ${className ?? ""}`} aria-hidden="true" />;
}

export function RadioDock() {
  const snap = useLofi();
  const playing = snap.startsWith("true");
  const station = STATIONS[stage.station];
  return (
    <aside className="radio" aria-label="Fizz FM, lo-fi radio">
      <button
        type="button"
        className="radio-play"
        onClick={() => void lofi.toggle()}
        aria-pressed={playing}
        aria-label={playing ? "Pause Fizz FM" : "Play Fizz FM"}
      >
        <Icon name={playing ? "pause" : "play"} size={16} />
      </button>
      <div className="radio-meta">
        <span className="radio-name">Fizz FM</span>
        <button type="button" className="radio-station" onClick={() => lofi.nextStation()} aria-label="Next station">
          {station.name}
          <Icon name="next" size={11} />
        </button>
      </div>
      <Visualizer />
    </aside>
  );
}
