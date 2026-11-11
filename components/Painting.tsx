"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { reducedMotion } from "@/lib/stage";

/**
 * A painting made of brush strokes, drawn in code.
 * Positions are fractions of the canvas, sizes are in thousandths of its
 * geometric mean, so the same strokes hold up at any size.
 */
type Stroke = { x: number; y: number; len: number; ang: number; w: number; bend: number; c: string; a: number };
type Rand = () => number;

/** The site palette (paper, ink, red, blue, yellow, lime) plus a few tints of it. */
const C = {
  ultra: "#151f8a",
  cobalt: "#2b58ff",
  cerulean: "#5f7fff",
  sky: "#a9b9ff",
  pale: "#e6e4f4",
  mint: "#d9f59a",
  peach: "#ffa496",
  coral: "#ff4d36",
  orange: "#ff7a36",
  lemon: "#ffd741",
  cream: "#f5f0e8",
  viridian: "#3f8f1f",
  leaf: "#7fcf2a",
  lime: "#b8f33b",
  deep: "#151515",
  white: "#fffdf8",
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rng = (seed: number): Rand => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = <T,>(r: Rand, arr: T[]) => arr[Math.floor(r() * arr.length)];
const range = (r: Rand, a: number, b: number) => a + r() * (b - a);

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

function stroke(r: Rand, x: number, y: number, len: number, ang: number, w: number, c: string, a = 0.9): Stroke {
  return { x, y, len, ang, w, c, a, bend: (r() - 0.5) * 0.25 };
}

/** A park by the water, after the Fauves: back to front, so it paints in the right order. */
function landscape(r: Rand, aspect: number): Stroke[] {
  const s: Stroke[] = [];
  const push = (...a: Parameters<typeof stroke> extends [Rand, ...infer R] ? R : never) => s.push(stroke(r, ...a));

  // sky
  for (let i = 0; i < 680; i++)
    push(r(), r() * 0.48, range(r, 30, 80), range(r, -0.6, 0.5), range(r, 16, 30), pick(r, [C.sky, C.sky, C.pale, C.mint, C.cerulean, C.pale]), 0.92);
  for (let i = 0; i < 60; i++) {
    const left = r() < 0.5;
    push(left ? r() * 0.12 : 0.88 + r() * 0.12, r() * 0.3, range(r, 30, 70), range(r, 0.6, 1.4), range(r, 16, 28), pick(r, [C.cobalt, C.ultra, C.cerulean]));
  }
  const clouds = 3 + Math.floor(r() * 2);
  for (let k = 0; k < clouds; k++) {
    const cx = range(r, 0.08, 0.92), cy = range(r, 0.06, 0.3);
    for (let i = 0; i < 46; i++)
      push(cx + (r() + r() - 1) * 0.09, cy + (r() + r() - 1) * 0.06, range(r, 24, 56), range(r, -0.5, 0.5), range(r, 14, 24), pick(r, [C.peach, C.peach, C.cream, C.coral]), 0.88);
  }

  // the far shore: pale facades under blue roofs
  for (let i = 0; i < 110; i++)
    push(r(), range(r, 0.37, 0.47), range(r, 30, 80), range(r, -0.12, 0.12), range(r, 12, 20), pick(r, [C.cream, C.white, C.lemon, C.pale, C.cream]));
  for (let i = 0; i < 46; i++)
    push(r(), range(r, 0.35, 0.385), range(r, 24, 60), range(r, -0.2, 0.2), range(r, 8, 14), pick(r, [C.cobalt, C.ultra]));

  // water
  for (let i = 0; i < 420; i++)
    push(r(), range(r, 0.64, 1.02), range(r, 60, 150), range(r, -0.07, 0.07), range(r, 10, 22), pick(r, [C.cobalt, C.cobalt, C.cerulean, C.ultra, C.sky]), 0.92);

  const n = 13 + Math.floor(r() * 5);
  const trees = Array.from({ length: n }, (_, i) => ({
    cx: (i + range(r, 0.1, 0.9)) / n,
    cy: range(r, 0.46, 0.53),
    rx: range(r, 0.03, 0.055),
    warm: r() < 0.3,
  }));

  // reflections first, so the promenade and crowns sit on top
  for (const t of trees)
    for (let i = 0; i < 9; i++)
      push(t.cx + (r() - 0.5) * t.rx * 2, range(r, 0.67, 0.82), range(r, 30, 70), range(r, -0.05, 0.05), range(r, 8, 14), t.warm ? pick(r, [C.orange, C.coral]) : pick(r, [C.viridian, C.leaf, C.deep]), 0.6);

  // promenade and the people on it
  for (let i = 0; i < 150; i++)
    push(r(), range(r, 0.585, 0.655), range(r, 40, 100), range(r, -0.1, 0.1), range(r, 10, 18), pick(r, [C.lemon, C.cream, C.cream, C.white, C.peach]));
  for (let i = 0; i < 22; i++)
    push(r(), range(r, 0.585, 0.62), range(r, 10, 16), Math.PI / 2 + range(r, -0.15, 0.15), range(r, 5, 8), pick(r, [C.ultra, C.coral, C.cobalt, C.orange, C.white]));

  // trees: trunks, then crowns lit from the top left
  for (const t of trees) push(t.cx, (t.cy + 0.61) / 2, 80, Math.PI / 2 + range(r, -0.08, 0.08), 7, C.ultra, 0.95);
  for (const t of trees) {
    const ry = t.rx * aspect;
    const body = t.warm ? [C.orange, C.coral, C.lemon, C.orange] : [C.viridian, C.leaf, C.lime, C.viridian, C.deep];
    for (let i = 0; i < 34; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = t.cx + Math.cos(a) * d * t.rx, y = t.cy + Math.sin(a) * d * ry;
      const top = y < t.cy;
      const c = top && r() < 0.35 ? (t.warm ? C.lemon : C.lime) : !top && r() < 0.3 ? (t.warm ? C.coral : C.deep) : pick(r, body);
      push(x, y, range(r, 18, 40), range(r, -1.2, 1.2), range(r, 12, 22), c);
    }
  }

  // light on the water, and a sunlit corner of path
  for (let i = 0; i < 16; i++) push(r(), range(r, 0.7, 0.95), range(r, 12, 24), range(r, -0.1, 0.1), range(r, 6, 10), C.white, 0.95);
  for (let i = 0; i < 160; i++) {
    const x = r() * 0.3, y = range(r, 0.72, 1.02);
    if (x > (y - 0.72) * 0.9) continue;
    push(x, y, range(r, 40, 90), range(r, -1, -0.6), range(r, 14, 24), pick(r, [C.lemon, C.lemon, C.orange, C.cream]));
  }
  return s;
}

/** A colour field split at a horizon, crossed by a few gestures. */
function abstract(r: Rand, aspect: number, base: string): Stroke[] {
  const s: Stroke[] = [];
  const push = (...a: Parameters<typeof stroke> extends [Rand, ...infer R] ? R : never) => s.push(stroke(r, ...a));
  const light = mix(base, "#ffffff", 0.45);
  const dark = mix(base, C.ultra, 0.5);
  const accent = pick(r, [C.coral, C.cobalt, C.lemon, C.viridian, C.orange]);
  const split = range(r, 0.38, 0.62);
  const theta = range(r, -0.35, 0.35);

  for (let i = 0; i < 230; i++)
    push(r(), r() * split, range(r, 90, 220), theta + range(r, -0.25, 0.25), range(r, 40, 75), pick(r, [light, light, base, C.white, C.pale]));
  for (let i = 0; i < 230; i++)
    push(r(), split + r() * (1.05 - split), range(r, 90, 220), -theta + range(r, -0.25, 0.25), range(r, 40, 75), pick(r, [base, dark, base, accent]));
  for (let i = 0; i < 40; i++)
    push(r(), split + range(r, -0.02, 0.02), range(r, 60, 140), range(r, -0.05, 0.05), range(r, 10, 18), pick(r, [C.white, C.lemon, light]));

  const gestures = 2 + Math.floor(r() * 3);
  for (let k = 0; k < gestures; k++) {
    let x = r(), y = r(), a = r() * Math.PI * 2;
    const c = pick(r, [accent, C.ultra, dark, C.white]);
    const w = range(r, 18, 34);
    for (let i = 0; i < 16; i++) {
      push(x, y, 40, a, w, c, 0.95);
      x += Math.cos(a) * 0.025;
      y += Math.sin(a) * 0.025 * aspect;
      a += range(r, -0.35, 0.35);
    }
  }
  const dots = 4 + Math.floor(r() * 8);
  for (let i = 0; i < dots; i++) push(r(), r(), 2, 0, range(r, 24, 48), pick(r, [accent, C.white, dark, C.lemon]), 0.95);
  return s;
}

/** One stroke: a curved body of paint, then a few bristle lines to give it ridges. */
function draw(ctx: CanvasRenderingContext2D, s: Stroke, W: number, H: number, U: number) {
  const x = s.x * W, y = s.y * H, L = s.len * U, w = s.w * U;
  const cos = Math.cos(s.ang), sin = Math.sin(s.ang);
  const curve = (off: number, k: number) => {
    const ox = -sin * off, oy = cos * off;
    const dx = (cos * L * k) / 2, dy = (sin * L * k) / 2;
    ctx.beginPath();
    ctx.moveTo(x - dx + ox, y - dy + oy);
    ctx.quadraticCurveTo(x - sin * s.bend * L + ox, y + cos * s.bend * L + oy, x + dx + ox, y + dy + oy);
    ctx.stroke();
  };
  // a flat brush: square ends, softened by a narrower round pass underneath
  ctx.globalAlpha = s.a;
  ctx.strokeStyle = s.c;
  ctx.lineCap = "round";
  ctx.lineWidth = w * 0.55;
  curve(0, 1);
  ctx.lineCap = "butt";
  ctx.lineWidth = w;
  curve(0, 0.92);
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.8, w * 0.12);
  ctx.strokeStyle = "#ffffff";
  ctx.globalAlpha = 0.24;
  curve(-w * 0.3, 0.85);
  ctx.globalAlpha = 0.12;
  curve(w * 0.05, 0.7);
  ctx.strokeStyle = "#000000";
  ctx.globalAlpha = 0.1;
  curve(w * 0.3, 0.85);
}

type Props = {
  label: string;
  variant?: "landscape" | "abstract";
  /** Same seed, same painting. Leave it out for a new one on every visit. */
  seed?: string;
  /** Dominant colour of an abstract. */
  color?: string;
  /** Seconds to paint in once it scrolls into view. */
  duration?: number;
  className?: string;
};

export function Painting({ label, variant = "abstract", seed, color = C.cobalt, duration = 2.6, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const box = canvas.getBoundingClientRect();
    const aspect = box.height ? box.width / box.height : 1.6;
    const r = rng(hash(seed ?? String(Math.random())));
    const strokes = variant === "landscape" ? landscape(r, aspect) : abstract(r, aspect, color);
    const ground = "#f5f0e8";

    let W = 0, H = 0, U = 1, drawn = 0;
    const repaint = () => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, W, H);
      ctx.lineCap = "round";
      for (let i = 0; i < drawn; i++) draw(ctx, strokes[i], W, H, U);
    };
    const resize = () => {
      const b = canvas.getBoundingClientRect();
      if (!b.width || !b.height || (b.width === W && b.height === H)) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = b.width;
      H = b.height;
      U = Math.sqrt(W * H) / 1000;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      repaint();
    };

    const still = reducedMotion();
    if (still) drawn = strokes.length;
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let tween: gsap.core.Tween | null = null;
    let io: IntersectionObserver | null = null;
    if (!still) {
      const state = { n: 0 };
      const paint = () => {
        ctx.lineCap = "round";
        const target = Math.floor(state.n);
        while (drawn < target) draw(ctx, strokes[drawn++], W, H, U);
      };
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io?.disconnect();
          tween = gsap.to(state, { n: strokes.length, duration, ease: "power1.inOut", onUpdate: paint });
        },
        { threshold: 0.15 },
      );
      io.observe(canvas);
    }

    return () => {
      ro.disconnect();
      io?.disconnect();
      tween?.kill();
    };
  }, [variant, seed, color, duration]);

  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}
