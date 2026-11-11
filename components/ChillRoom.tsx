"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import { lofi } from "@/lib/lofi";
import { tracks } from "@/lib/listening-tracks";
import { stage } from "@/lib/stage";
import { Icon } from "./Icon";
import { useLofi } from "./Radio";
import styles from "./ChillRoom.module.css";

const display = localFont({ src: [
  { path: "../public/fonts/listening/barlow-condensed-700-latin.woff2", weight: "700" },
  { path: "../public/fonts/listening/barlow-condensed-800-latin.woff2", weight: "800" },
  { path: "../public/fonts/listening/barlow-condensed-900-latin.woff2", weight: "900" },
], variable: "--listening-display", display: "swap", preload: false });
const handwriting = localFont({ src: "../public/fonts/listening/caveat-500-latin.woff2", weight: "500", variable: "--listening-hand", display: "swap", preload: false });
const ListeningPainting = dynamic(() => import("./ListeningPainting").then(module => module.ListeningPainting));
const OPEN_EVENT = "fizz:stay";
export const openStay = () => window.dispatchEvent(new Event(OPEN_EVENT));
const MODES = { focus: 25 * 60, break: 5 * 60 } as const;
type Mode = keyof typeof MODES;
const pad = (n: number) => String(n).padStart(2, "0");
const rangeStyle = (value: number) => ({ "--range-fill": `${value * 100}%` } as CSSProperties);

type YouTubePlayer = { setVolume: (volume: number) => void; destroy: () => void };
type YouTubeWindow = Window & { YT?: { Player: new (element: HTMLIFrameElement, options: { events: { onReady: (event: { target: YouTubePlayer }) => void } }) => YouTubePlayer }; onYouTubeIframeAPIReady?: () => void };
let youtubeApi: Promise<void> | undefined;
function loadYouTubeApi() {
  const win = window as YouTubeWindow;
  if (win.YT?.Player) return Promise.resolve();
  if (!youtubeApi) youtubeApi = new Promise<void>((resolve, reject) => {
    const previous = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { youtubeApi = undefined; reject(new Error("YouTube API unavailable")); };
    document.head.appendChild(script);
  });
  return youtubeApi;
}

function YouTubeVideo({ track, started, volume }: { track: number; started: boolean; volume: number }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const currentVolume = useRef(volume);
  useEffect(() => { currentVolume.current = volume; player.current?.setVolume(volume); }, [volume]);
  useEffect(() => {
    let cancelled = false;
    void loadYouTubeApi().then(() => {
      if (cancelled || !iframe.current) return;
      player.current = new (window as YouTubeWindow).YT!.Player(iframe.current, { events: { onReady: event => event.target.setVolume(currentVolume.current) } });
    }).catch(() => {});
    return () => { cancelled = true; player.current?.destroy(); player.current = null; };
  }, [track, started]);
  return <iframe key={`${track}-${started}`} ref={iframe} title="Fizz FM YouTube player" src={`https://www.youtube.com/embed/GMuLmqvONho?start=${tracks[track][1]}&autoplay=${started ? 1 : 0}&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin)}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}

function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className={styles.clock}>
    <time dateTime={now?.toISOString()}>{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--"}</time>
  </div>;
}

function FocusTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [left, setLeft] = useState<number>(MODES.focus);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        lofi.chime();
        const next = mode === "focus" ? "break" : "focus";
        setMode(next);
        setLeft(MODES[next]);
        setRunning(false);
        setAnnouncement(`${mode === "focus" ? "Focus session" : "Break"} complete. ${next === "focus" ? "Focus" : "Break"} timer ready.`);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [running, mode]);
  const pick = (next: Mode) => { setMode(next); setLeft(MODES[next]); setRunning(false); };
  const toggle = () => {
    if (running) { setLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))); setRunning(false); }
    else { deadline.current = Date.now() + left * 1000; setRunning(true); }
  };
  return <section className={`${styles.panel} ${styles.timerPanel}`} aria-labelledby="listening-timer-heading">
    <h2 id="listening-timer-heading" className={styles.panelTitle}><span>03 /</span> FOCUS TIMER</h2>
    <p className={styles.timerReadout} aria-label={`${Math.floor(left / 60)} minutes ${left % 60} seconds`}>{pad(Math.floor(left / 60))}:{pad(left % 60)}</p>
    <div className={styles.segments} role="group" aria-label="Timer mode">
      <button type="button" aria-pressed={mode === "focus"} onClick={() => pick("focus")}>FOCUS 25</button>
      <button type="button" aria-pressed={mode === "break"} onClick={() => pick("break")}>BREAK 5</button>
    </div>
    <div className={styles.timerActions}>
      <button type="button" className={styles.primary} onClick={toggle}><Icon name={running ? "pause" : "play"} size={22} />{running ? "Pause" : left === MODES[mode] ? "Start" : "Resume"}</button>
      <button type="button" className={styles.reset} onClick={() => pick(mode)}>Reset</button>
    </div>
    <span className="sr-only" role="status">{announcement}</span>
  </section>;
}

/** A paper listening room; its scene and animation load only after the visitor opens it. */
export function ChillRoom() {
  const [open, setOpen] = useState(false);
  const [paintingPaused, setPaintingPaused] = useState(false);
  const [audioError, setAudioError] = useState("");
  useLofi();
  const [track, setTrack] = useState(0);
  const [playerStarted, setPlayerStarted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const chooseTrack = (index: number) => { setTrack(index); setPlayerStarted(true); };
  useEffect(() => {
    const onOpen = () => {
      opener.current = document.activeElement;
      setPaintingPaused(false);
      setOpen(true);
      setTrack(0);
      setPlayerStarted(false);
      void lofi.play(true).catch(() => setAudioError("Ambience could not start."));
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    stage.lenis?.stop();
    document.documentElement.classList.add("is-staying");
    dialog.current?.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, iframe, a[href], [tabindex="0"]') ?? []).filter(e => e.getClientRects().length);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-staying");
      lofi.pause();
      stage.lenis?.start();
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, close]);
  if (!open) return null;
  return createPortal(
    <div ref={dialog} className={`${styles.room} ${display.variable} ${handwriting.variable}`} role="dialog" aria-modal="true" aria-labelledby="listening-room-title" data-listening-room data-lenis-prevent>
      <header className={styles.header}>
        <div className={styles.brand} aria-label="Fizz FM"><span className={styles.monogram}>F<span>.</span></span><span className={styles.brandName}>FIZZ FM</span></div>
        <h1 id="listening-room-title">THE LISTENING ROOM</h1>
        <button type="button" className={styles.back} onClick={close} data-autofocus><Icon name="arrow" className={styles.backArrow} size={22} /><span>Back to exhibition</span></button>
      </header>
      <div className={styles.scene}>
        <ListeningPainting paused={paintingPaused} className={styles.painting} />
        <div className={styles.youtubePlayer}>
          <YouTubeVideo track={track} started={playerStarted} volume={musicVolume} />
        </div>
        <LocalClock />
        <img className={styles.paperNote} src="/optimized/listening-room/stay-note.webp" alt="Stay a little longer." />
        <button type="button" className={styles.motionToggle} aria-label={paintingPaused ? "Resume painting animation" : "Pause painting animation"} aria-pressed={paintingPaused} onClick={() => setPaintingPaused(value => !value)} title={paintingPaused ? "Resume painting" : "Pause painting"}><Icon name={paintingPaused ? "play" : "pause"} size={18} /></button>
      </div>
      <div className={styles.controls}>
        <section className={`${styles.panel} ${styles.musicPanel}`} aria-labelledby="listening-music-heading">
          <h2 id="listening-music-heading" className={styles.panelTitle}><span>01 /</span> FIZZ FM</h2>
          <p className={styles.stationName}>{tracks[track][0]}</p>
          <label className={styles.trackSelect}>CHOOSE A TRACK
            <select value={track} onChange={event => chooseTrack(Number(event.target.value))}>
              {tracks.map(([name, seconds], index) => <option key={name} value={index}>{pad(Math.floor(seconds / 60))}:{pad(seconds % 60)} · {name}</option>)}
            </select>
          </label>
          <div className={styles.trackControls}>
            <button type="button" onClick={() => chooseTrack((track + tracks.length - 1) % tracks.length)}>← Previous</button>
            <button type="button" onClick={() => chooseTrack((track + 1) % tracks.length)}>Next →</button>
          </div>
          <label className={styles.volume}><Icon name="volume" size={24} /><span>Volume</span><input aria-label="Music volume" type="range" min="0" max="100" value={musicVolume} style={rangeStyle(musicVolume / 100)} onChange={event => setMusicVolume(Number(event.target.value))} /></label>
          {audioError && <p className={styles.audioError} role="status">{audioError}</p>}
        </section>
        <section className={`${styles.panel} ${styles.ambiencePanel}`} aria-labelledby="listening-ambience-heading">
          <h2 id="listening-ambience-heading" className={styles.panelTitle}><span>02 /</span> AMBIENCE</h2>
          <label className={styles.rain}><Icon name="rain" size={42} /><span>Rain</span><input type="range" min="0" max="1" step="0.01" value={lofi.rain} style={rangeStyle(lofi.rain)} onChange={e => lofi.setRain(Number(e.target.value))} /></label>
          <div className={styles.crackle}><Icon name="vinyl" size={38} /><span>Vinyl crackle</span><button type="button" role="switch" aria-label="Vinyl crackle" aria-checked={lofi.crackle} className={styles.switch} onClick={() => lofi.setCrackle(!lofi.crackle)}><span /></button></div>
          <p className={styles.ambienceNote}>A softer kind of silence.</p>
        </section>
        <FocusTimer />
      </div>
      <footer className={styles.footer}><span /> <p>NO RUSH. MAKE YOURSELF AT HOME.<i aria-hidden="true" /></p><span /></footer>
    </div>, document.body,
  );
}

