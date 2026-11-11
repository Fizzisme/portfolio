"use client";

import { useEffect, useRef } from "react";
import { imageAsset } from "@/lib/image-assets";

const DRAW = 6500;
const HOLD = 6500;
const ERASE = 3500;
const REST = 600;
const CYCLE = DRAW + HOLD + ERASE + REST;

/** Source artwork is painted through overlapping, ragged brush strokes, then erased in reverse. */
export function ListeningPainting({ paused, className }: { paused: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    const source = document.createElement("canvas");
    const sourceContext = source.getContext("2d")!;
    const mask = document.createElement("canvas");
    const brush = mask.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const image = new window.Image();
    image.decoding = "async";
    let disposed = false;
    let loaded = false;
    let frame = 0;
    let timer = 0;
    let epoch = 0;
    let frozenAt: number | null = null;
    let lastFrame = 0;
    let cycle = -1;
    let painted = 0;
    let erased = 0;
    let strokes: { x: number; y: number; length: number; width: number; tilt: number; order: number }[] = [];

    const composite = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      context.drawImage(source, 0, 0);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(mask, 0, 0);
      context.globalCompositeOperation = "source-over";
    };
    const stroke = (index: number, erase = false) => {
      const s = strokes[index];
      brush.globalCompositeOperation = erase ? "destination-out" : "source-over";
      brush.strokeStyle = "#fff";
      brush.lineCap = "round";
      // Parallel bristles leave a soft, uneven edge around the opaque core.
      for (let bristle = -2; bristle <= 2; bristle++) {
        brush.globalAlpha = bristle === 0 || erase ? 1 : .42;
        brush.lineWidth = bristle === 0 ? s.width * (erase ? 1.65 : 1) : s.width * .14;
        const y = s.y + bristle * s.width * .26;
        brush.beginPath();
        brush.moveTo(s.x - s.length / 2, y - s.tilt);
        brush.quadraticCurveTo(s.x, y + s.tilt * .6, s.x + s.length / 2, y + s.tilt);
        brush.stroke();
      }
      brush.globalAlpha = 1;
    };
    const cancel = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = 0;
      timer = 0;
    };
    const render = (now: number) => {
      frame = 0;
      if (disposed || !loaded || pausedRef.current || document.hidden) return;
      if (now - lastFrame < 1000 / 30) {
        frame = requestAnimationFrame(render);
        return;
      }
      lastFrame = now;
      const elapsed = Math.max(0, now - epoch);
      const nextCycle = Math.floor(elapsed / CYCLE);
      const time = elapsed % CYCLE;
      if (cycle !== nextCycle) {
        cycle = nextCycle;
        painted = erased = 0;
        brush.clearRect(0, 0, mask.width, mask.height);
        canvas.dataset.paintCycle = String(cycle);
      }
      if (time < DRAW) {
        canvas.dataset.paintPhase = "drawing";
        const target = Math.ceil(strokes.length * time / DRAW);
        while (painted < target) stroke(painted++);
      } else if (time < DRAW + HOLD) {
        canvas.dataset.paintPhase = "holding";
        brush.globalCompositeOperation = "source-over";
        brush.fillStyle = "#fff";
        brush.fillRect(0, 0, mask.width, mask.height);
        composite();
        // A finished painting does no animation work until the erase phase starts.
        timer = window.setTimeout(() => { frame = requestAnimationFrame(render); }, DRAW + HOLD - time + 10);
        return;
      } else if (time < DRAW + HOLD + ERASE) {
        canvas.dataset.paintPhase = "erasing";
        const target = Math.ceil(strokes.length * (time - DRAW - HOLD) / ERASE);
        while (erased < target) stroke(strokes.length - 1 - erased++, true);
      } else {
        canvas.dataset.paintPhase = "resting";
        brush.clearRect(0, 0, mask.width, mask.height);
        composite();
        timer = window.setTimeout(() => { frame = requestAnimationFrame(render); }, CYCLE - time + 10);
        return;
      }
      composite();
      frame = requestAnimationFrame(render);
    };
    const wake = () => {
      cancel();
      if (!loaded || disposed) return;
      const now = performance.now();
      if (reduced.matches) {
        context.globalCompositeOperation = "source-over";
        context.drawImage(source, 0, 0);
        canvas.dataset.paintPhase = "still";
        return;
      }
      if (pausedRef.current || document.hidden) {
        if (frozenAt === null) frozenAt = now;
        return;
      }
      if (frozenAt !== null) epoch += now - frozenAt;
      frozenAt = null;
      frame = requestAnimationFrame(render);
    };
    const resize = () => {
      if (!loaded) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const resolution = Math.min(window.devicePixelRatio || 1, 1.5, 1920 / rect.width);
      const width = Math.round(rect.width * resolution);
      const height = Math.round(rect.height * resolution);
      if (canvas.width === width && canvas.height === height) return;
      const previousMask = document.createElement("canvas");
      previousMask.width = mask.width;
      previousMask.height = mask.height;
      previousMask.getContext("2d")!.drawImage(mask, 0, 0);
      const hasPainting = cycle >= 0;
      canvas.width = source.width = mask.width = width;
      canvas.height = source.height = mask.height = height;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      sourceContext.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2,
        image.naturalWidth * scale, image.naturalHeight * scale);
      let seed = 1047;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const columns = 24;
      const rows = 14;
      const cellWidth = width / columns;
      const cellHeight = height / rows;
      strokes = Array.from({ length: columns * rows }, (_, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        return {
          x: (col + .5 + (random() - .5) * .24) * cellWidth,
          y: (row + .5 + (random() - .5) * .2) * cellHeight,
          length: cellWidth * (1.35 + random() * .4), width: cellHeight * 1.65,
          tilt: (random() - .5) * cellHeight * .65,
          order: Math.hypot(col / columns - .53, row / rows - .52) + random() * .23,
        };
      }).sort((a, b) => a.order - b.order);
      if (hasPainting) {
        brush.drawImage(previousMask, 0, 0, width, height);
        composite();
      } else {
        epoch = performance.now();
        cycle = -1;
        painted = erased = 0;
        frozenAt = null;
        if (pausedRef.current) context.drawImage(source, 0, 0);
      }
      wake();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    image.onload = () => { if (!disposed) { loaded = true; resize(); } };
    image.onerror = () => {
      if (!image.src.endsWith("reading-nook.webp")) image.src = imageAsset("/stay/reading-nook.png");
    };
    image.src = imageAsset("/listening-room/scene.png");
    wakeRef.current = wake;
    document.addEventListener("visibilitychange", wake);
    reduced.addEventListener("change", wake);
    return () => {
      disposed = true;
      cancel();
      observer.disconnect();
      document.removeEventListener("visibilitychange", wake);
      reduced.removeEventListener("change", wake);
      wakeRef.current = null;
      image.onload = image.onerror = null;
    };
  }, []);

  return <canvas ref={canvasRef} className={className} role="img"
    aria-label="A painting of a rainy midnight listening room: a record player, copper lamp, open book and orange armchair. Brush strokes paint the scene, erase it, and begin again." />;
}
