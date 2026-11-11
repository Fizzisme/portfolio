"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { RoomAssets, RoomImage as Image, useRoomAssetsReady } from "./RoomAssets";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { certificates, contact, profile, projects, stack, type Certificate } from "@/content";
import { scrollToId, stage } from "@/lib/stage";
import { Icon, type IconName } from "./Icon";
import { openStay } from "./ChillRoom";
import { imageAsset } from "@/lib/image-assets";

const RepoModal = dynamic(() => import("./FileTree").then(module => module.RepoModal));
const Painting = dynamic(() => import("./Painting").then(module => module.Painting));

function ProjectPainting({ seed, color, label }: { seed: string; color: string; label: string }) {
  const ready = useRoomAssetsReady("projects");
  return ready ? <Painting seed={seed} color={color} label={label} /> : null;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
/** Painting colour per work when it has no illustration of its own. */
const ART = ["#2b58ff", "#ffd741", "#ff4d36", "#2b58ff"];

/** Torn-paper frames for the work cards, with the white photo window of each as a fraction of the image. */
const FRAMES = [
  { src: "/projects/frame-ivory.png", win: [0.0414, 0.1223, 0.3963, 0.7541] },
  { src: "/projects/frame-lavender.png", win: [0.055, 0.1387, 0.4019, 0.7188] },
  { src: "/projects/frame-lavender.png", win: [0.055, 0.1387, 0.4019, 0.7188] },
  { src: "/projects/frame-yellow.png", win: [0.0484, 0.1349, 0.3959, 0.7289] },
] as const;
const pad = (n: number) => String(n).padStart(2, "0");

function Sample({ label = "Sample" }: { label?: string }) {
  return (
    <span className="sample" title="Placeholder, to be replaced">
      {label}
    </span>
  );
}

/** A link, or a quiet "soon" label when the href is still a placeholder. */
function LinkOrSoon({ href, label, icon }: { href: string; label: string; icon?: IconName }) {
  if (!href || href === "#")
    return (
      <span className="soon" aria-disabled="true">
        {icon && <Icon name={icon} />} {label} <em>soon</em>
      </span>
    );
  const external = href.startsWith("http");
  return (
    <a className="link" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      {icon && <Icon name={icon} />} <span>{label}</span> {external && <Icon name="out" size={14} className="arrow" />}
    </a>
  );
}

function RoomHead({ n, kicker, id, children }: { n: number; kicker: string; id: string; children: React.ReactNode }) {
  return (
    <header className="room-head" data-reveal>
      <p className="eyebrow">
        <span>Room {ROMAN[n]}</span>
        <span className="sep" aria-hidden="true" />
        <span>{kicker}</span>
      </p>
      <h2 id={id} className="room-title">
        {children}
      </h2>
    </header>
  );
}

/** A card's demo video: muted and looping while it is on screen, paused when it isn't. */
function WorkVideo({ src, title, onOpen }: { src: string; title: string; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const ready = useRoomAssetsReady("projects");
  useEffect(() => {
    const v = ref.current;
    if (!v || !ready) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [ready]);
  return (
    <>
      <video ref={ref} src={ready ? src : undefined} muted loop playsInline preload="none" aria-label={`${title}, demo video`} />
      <button type="button" className="work-play" onClick={onOpen} aria-haspopup="dialog" aria-label={`Watch the ${title} demo`}>
        <span aria-hidden="true">
          <Icon name="play" size={12} /> Watch demo
        </span>
      </button>
    </>
  );
}

/** The demo at full size, with controls. Esc, the backdrop and the button all close it. */
function VideoModal({ title, src, onClose }: { title: string; src: string; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    stage.lenis?.stop();
    document.documentElement.classList.add("is-modal");
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-modal");
      stage.lenis?.start();
      opener?.focus?.();
    };
  }, [onClose]);
  return createPortal(
    <div className="cert-modal" role="dialog" aria-modal="true" aria-label={`${title}, demo video`} onClick={onClose}>
      <div className="cert-sheet video-sheet" onClick={(e) => e.stopPropagation()}>
        <button ref={closeBtn} type="button" className="cert-close" onClick={onClose} aria-label="Close video">
          <Icon name="close" size={18} />
        </button>
        <video src={src} controls autoPlay playsInline className="video-player" />
      </div>
    </div>,
    document.body,
  );
}

/** Popup with the certificate itself. Esc, the backdrop and the button all close it. */
function CertModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    stage.lenis?.stop();
    document.documentElement.classList.add("is-modal");
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-modal");
      stage.lenis?.start();
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="cert-modal" role="dialog" aria-modal="true" aria-label={`Certificate: ${cert.name}`} onClick={onClose}>
      <div className="cert-sheet" onClick={(e) => e.stopPropagation()}>
        <button ref={closeBtn} type="button" className="cert-close" onClick={onClose} aria-label="Close certificate">
          <Icon name="close" size={18} />
        </button>
        {cert.image ? (
          <>
            {imageState === "loading" && <div className="cert-loading" role="status" aria-label="Loading certificate"><span /><span /><span /><span /></div>}
            {imageState === "error" && <div className="cert-empty" role="alert">Could not load the certificate. Please try again.</div>}
            <img className="cert-photo" src={imageAsset(cert.image.src)} width={cert.image.width} height={cert.image.height} alt={`Certificate: ${cert.name}, ${cert.issuer}`} onLoad={() => setImageState("loaded")} onError={() => setImageState("error")} hidden={imageState !== "loaded"} />
          </>
        ) : (
          <div className="cert-empty">
            <p className="eyebrow">{cert.issuer}</p>
            <h3>{cert.name}</h3>
            <p>Certificate image coming soon.</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Splits a line into masked words so each one can rise on its own. */
function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="w">
            <span className="wi">{w}</span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

export function Story() {
  const root = useRef<HTMLElement>(null);
  const [openCert, setOpenCert] = useState<number | null>(null);
  const [openVideo, setOpenVideo] = useState<number | null>(null);
  const [openRepo, setOpenRepo] = useState<number | null>(null);
  const closeRepo = useCallback(() => setOpenRepo(null), []);
  const closeVideo = useCallback(() => setOpenVideo(null), []);
  const closeCert = useCallback(() => setOpenCert(null), []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 861px)",
        // the sheet transitions only run when every room fits on one screen, otherwise a room's bottom would be covered unseen
        sheets: "(min-width: 861px) and (min-height: 665px)",
      },
      (c) => {
        const { motion, sheets, desktop } = c.conditions as { motion: boolean; sheets: boolean; desktop: boolean };
        if (!motion) return;
        const q = gsap.utils.selector(root);
        const NAV = 64;
        const els = (sel: string, scope?: Element) => (scope ? Array.from(scope.querySelectorAll<HTMLElement>(sel)) : (q(sel) as HTMLElement[]));
        const all = els(":scope > section");
        const room = (id: string) => all.find((s) => s.id === id)!;
        const [me, toolkit, works, certs, contactRoom, stay] = ["me", "stack", "projects", "certificates", "contact", "stay"].map(room);
        // Where an element sits in the page, from layout alone. Rooms are moved with transforms while they arrive,
        // and a bounding box would carry that shift into every trigger measured on them.
        const topOf = (el: HTMLElement) => {
          let n: HTMLElement | null = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
          let y = 0;
          while (n) {
            y += n.offsetTop;
            n = n.offsetParent as HTMLElement | null;
          }
          return y;
        };
        const vh = () => window.innerHeight;

        // The preloader already reveals the hero. Keep its image painted while GSAP initializes.

        // ── 1. transitions between rooms ──────────────────────────────────────────
        // Each room is held under the header while the next one arrives on top of it.
        // The hero hands over to About by a sheet sliding up; every later room arrives its own way,
        // held still at the top (the y offset cancels the scroll) while it is revealed in place.
        // every entrance is recorded against its room, so the stop at that room can wait for it to finish
        const intro = new Map<HTMLElement, gsap.core.Animation[]>();
        let contactFlight: gsap.core.Timeline | undefined;
        const reg = <A extends gsap.core.Animation | undefined>(el: HTMLElement, a: A): A => {
          if (a) intro.set(el, [...(intro.get(el) ?? []), a]);
          return a;
        };
        const cleanups: (() => void)[] = [];
        if (sheets) {
          all.slice(0, -1).forEach((sheet, i) => {
            const first = i === 0;
            const start = () => topOf(sheet) - (first ? 0 : NAV);
            ScrollTrigger.create({
              trigger: sheet,
              start,
              end: () => start() + sheet.offsetHeight - (first ? NAV : 0),
              pin: true,
              pinSpacing: false,
              invalidateOnRefresh: true,
            });
          });

          const span = (el: HTMLElement) => ({ start: () => topOf(el) - vh(), end: () => topOf(el) - NAV, scrub: true, invalidateOnRefresh: true });
          const hold = () => -(window.innerHeight - NAV);

          // the arriving room: [room, from, to]
          const arrivals: [HTMLElement, gsap.TweenVars, gsap.TweenVars][] = [
            // About -> Stack: the sheet is thrown in from the right and lands straight
            [toolkit, { y: hold, x: () => window.innerWidth, rotation: 6 }, { y: 0, x: 0, rotation: 0, transformOrigin: "100% 100%" }],
            [works, { y: hold, clipPath: "circle(0% at 50% 55%)" }, { y: 0, clipPath: "circle(80% at 50% 55%)" }],
            [certs, { y: hold, clipPath: "inset(50% 0% 50% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)" }],
            [contactRoom, { y: hold }, { y: 0 }],
            [stay, { y: hold, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)" }],
          ];
          arrivals.forEach(([el, from, to]) => {
            gsap.fromTo(el, from, { ...to, ease: "none", scrollTrigger: span(el) });
            // held rooms are pulled a screen up ahead of time, so keep each one out of sight until its turn
            gsap.set(el, { visibility: "hidden" });
            ScrollTrigger.create({
              // a few px in, so a reveal that starts as a zero-height slit never shows as a hairline at the stop before it
              start: () => topOf(el) - vh() + 6,
              // never ends: a trigger that ends at the bottom of the page is inactive there, which hid the last room
              end: () => ScrollTrigger.maxScroll(window) + 100000,
              invalidateOnRefresh: true,
              onToggle: (self) => gsap.set(el, { visibility: self.isActive ? "visible" : "hidden" }),
            });
          });

          const mail = els(".contact-mail", contactRoom)[0];
          const flyer = q(".mail-flyer")[0] as HTMLElement | undefined;
          if (mail && flyer) {
            const left = mail.parentElement as HTMLElement;
            const card = () => {
              const cw = Math.min(mail.offsetWidth, mail.offsetHeight * (1774 / 887));
              const ch = cw / (1774 / 887);
              return { cw, ch, x: left.offsetLeft + mail.offsetLeft, y: NAV + left.offsetTop + mail.offsetTop + (mail.offsetHeight - ch) / 2 };
            };
            const size = () => { const { cw, ch } = card(); gsap.set(flyer, { width: cw, height: ch }); };
            size();
            ScrollTrigger.addEventListener("refreshInit", size);
            const mid = () => ({ x: (window.innerWidth - card().cw) / 2, y: (window.innerHeight + NAV - card().ch) / 2 });
            gsap.set(mail, { opacity: 0 });
            const flight = gsap.timeline({ paused: true, defaults: { ease: "none" }, scrollTrigger: { start: () => topOf(contactRoom) - vh() + 40, end: () => ScrollTrigger.maxScroll(window) + 100000, toggleActions: "play none none reverse", invalidateOnRefresh: true } })
              .fromTo(flyer, { x: () => -card().cw * 1.3, y: () => mid().y + 80, rotation: -16, scale: 0.85, autoAlpha: 1 }, { x: () => mid().x, y: () => mid().y, rotation: 0, scale: 1.35, duration: 1.4, ease: "sine.inOut", immediateRender: true }, 0)
              .to(flyer, { y: () => mid().y - 12, rotation: 2, duration: 0.4, ease: "sine.inOut" }, 1.4)
              .fromTo(contactRoom, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.inOut", immediateRender: true }, 1.6)
              .to(flyer, { x: () => card().x, y: () => card().y, rotation: 0, scale: 1, duration: 0.8, ease: "power2.inOut" }, 1.7)
              .fromTo(mail, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 2.5)
              .fromTo(flyer, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01 }, 2.5);
            reg(contactRoom, flight);
            contactFlight = flight;
            cleanups.push(() => ScrollTrigger.removeEventListener("refreshInit", size));
          }

          // the room being covered answers each arrival differently (created after the arrivals, so they don't render early)
          const leaves: [HTMLElement, gsap.TweenVars][] = [
            [room("top"), { scale: 0.88, rotation: -2, "--shade": 0.6, transformOrigin: "50% 30%" }],
            [me, { scale: 1.12, "--shade": 0.75, transformOrigin: "50% 55%" }],
            [toolkit, { x: () => -window.innerWidth * 0.3, rotation: -3, "--shade": 0.6, transformOrigin: "0% 100%" }],
            [works, { scale: 0.94, "--shade": 0.8 }],
            [certs, { yPercent: -8, "--shade": 0.6 }],
            [contactRoom, { scale: 0.92, "--shade": 0.7 }],
          ];
          const rest: Record<string, number> = { scale: 1, rotation: 0, x: 0, yPercent: 0, "--shade": 0 };
          leaves.forEach(([el, to]) => {
            const next = all[all.indexOf(el) + 1];
            const from = Object.fromEntries(Object.keys(to).filter((k) => k in rest).map((k) => [k, rest[k]]));
            gsap.fromTo(el, from, { ...to, ease: "none", immediateRender: false, scrollTrigger: span(next) });
          });
        }

        // ── 2. what happens inside each room once it has arrived ──────────────────
        // revealed rooms wait until the reveal is nearly done; About slides, so it can start early
        const at = (el: HTMLElement) => ({ start: () => topOf(el) - vh() * (sheets && el !== me ? 0.3 : 0.72), invalidateOnRefresh: true });
        const slap: gsap.TweenVars = { scale: 1.6, rotation: -14, opacity: 0, duration: 0.8, ease: "back.out(2.2)", stagger: 0.12 };

        const heading = (el: HTMLElement, words: gsap.TweenVars) => {
          const head = els(".about-head, .works-head", el)[0];
          if (!head) return undefined;
          const tl = gsap.timeline({ scrollTrigger: at(el) });
          tl.from(els(".eyebrow", head), { x: -28, opacity: 0, duration: 0.6, ease: "power3.out" });
          tl.from(els(".wi", head), { duration: 1.05, ease: "expo.out", stagger: 0.055, ...words }, "<0.1");
          const extras = els(".certs-sub, .works-note, .certs-note", head);
          if (extras.length) tl.from(extras, slap, "-=0.55");
          return tl;
        };
        reg(me, heading(me, { yPercent: 118, rotation: 8 })); // words rise
        reg(toolkit, heading(toolkit, { yPercent: -118, rotation: -8 })); // words drop in from above
        if (desktop) {
          reg(works, heading(works, { xPercent: -110 }));
          reg(certs, heading(certs, { rotationX: -100, transformOrigin: "50% 100%", transformPerspective: 600, opacity: 0 }));
        }

        // About: robots slapped on, the portrait drifts into place, the copy comes in line by line
        reg(me, gsap.from(els(".about-robots", me), { scale: 0.55, rotation: 18, opacity: 0, duration: 1, ease: "back.out(1.8)", scrollTrigger: { start: () => topOf(me) - vh() * 0.6, invalidateOnRefresh: true } }));
        gsap.fromTo(
          els(".about-figure", me),
          { yPercent: 16, rotation: -6 },
          { yPercent: 0, rotation: 0, ease: "none", scrollTrigger: { start: () => topOf(me) - vh(), end: () => topOf(me) - NAV, scrub: true, invalidateOnRefresh: true } },
        );
        const body = els(".about-body", me)[0];
        if (body) {
          reg(me, gsap.from(Array.from(body.children), { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, scrollTrigger: { start: () => topOf(body) - vh() * 0.8, invalidateOnRefresh: true } }));
          reg(me, gsap.from(els(".tags li", body), { scale: 0, rotation: -12, duration: 0.55, ease: "back.out(2.6)", stagger: 0.07, delay: 0.5, scrollTrigger: { start: () => topOf(body) - vh() * 0.8, invalidateOnRefresh: true } }));
        }

        // Stack: each card is pinned onto the board, landing a little crooked then settling
        reg(toolkit, gsap.from(els(".tool-card", toolkit), {
          y: 150,
          rotation: () => gsap.utils.random(-12, 12),
          scale: 0.84,
          opacity: 0,
          duration: 1.15,
          ease: "back.out(1.35)",
          stagger: { each: 0.09, from: "random" },
          delay: 0.3,
          clearProps: "transform,opacity",
          scrollTrigger: at(toolkit),
        }));

        if (desktop) {
          const grid = els(".works-grid", works)[0];
          if (grid) {
            const toCentre = (axis: "x" | "y") => (_: number, el: HTMLElement) => axis === "x" ? grid.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2) : grid.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2);
            reg(works, gsap.from(els(".work-card", grid), { x: toCentre("x"), y: toCentre("y"), rotation: (i: number) => (i - 1.5) * 9, scale: 0.72, duration: 0.9, ease: "power4.out", stagger: 0.08, delay: 0.1, clearProps: "transform", scrollTrigger: { start: () => topOf(works) - vh() * 0.55, invalidateOnRefresh: true } }));
          }
          reg(certs, gsap.from(els(".cert-card", certs), { x: (i: number) => (i % 2 ? 1 : -1) * window.innerWidth * 0.65, y: 90, rotation: (i: number) => (i % 2 ? 28 : -28), scale: 0.8, duration: 1.25, ease: "power4.out", stagger: 0.16, delay: 0.3, clearProps: "transform", scrollTrigger: at(certs) }));
          reg(contactRoom, gsap.from(els(".hello-word", contactRoom), { yPercent: 40, rotation: -6, scale: 0.8, opacity: 0, duration: 1, ease: "back.out(1.6)", scrollTrigger: at(contactRoom) }));
          reg(contactRoom, gsap.from(els(".hello-blossom", contactRoom), { scale: 0.4, rotation: 24, opacity: 0, transformOrigin: "0% 100%", duration: 1.2, ease: "back.out(1.7)", delay: 0.3, scrollTrigger: at(contactRoom) }));
          reg(contactRoom, gsap.from(els(".contact-sheet", contactRoom), { y: -160, rotation: 7, opacity: 0, duration: 1.1, ease: "power4.out", delay: 0.2, clearProps: "transform,opacity", scrollTrigger: at(contactRoom) }));
          reg(contactRoom, gsap.from(els(".contact-row", contactRoom), { x: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, delay: 0.7, scrollTrigger: at(contactRoom) }));
          reg(stay, gsap.from(els(".stay-title .wi", stay), { yPercent: 118, rotation: 8, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: at(stay) }));
          reg(stay, gsap.from(els(".stay-nook", stay), { scale: 0.86, rotation: -5, opacity: 0, transformOrigin: "20% 60%", duration: 1.2, ease: "power4.out", scrollTrigger: at(stay) }));
          reg(stay, gsap.from(els(".stay-blossom", stay), { scale: 0.4, rotation: -22, opacity: 0, transformOrigin: "100% 0%", duration: 1.2, ease: "back.out(1.7)", delay: 0.3, scrollTrigger: at(stay) }));
          reg(stay, gsap.from(els(".stay-feat", stay), { y: 30, scale: 0.7, opacity: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.1, delay: 0.5, scrollTrigger: at(stay) }));
          reg(stay, gsap.from(els(".stay-note", stay), { clipPath: "inset(0 100% 0 0)", duration: 1, ease: "power2.inOut", delay: 0.8, scrollTrigger: at(stay) }));
          reg(stay, gsap.from(els(".stay-collage", stay), { x: 140, rotation: 7, opacity: 0, duration: 1, ease: "power4.out", delay: 0.6, scrollTrigger: at(stay) }));
        }

        // everything else marked for reveal that the steps above don't already move
        els("[data-reveal]")
          .filter((el) => desktop || !el.closest("#projects, #certificates, #contact, #stay"))
          .filter((el) => !el.matches(".tool-card, .work-card, .cert-card, .about-head, .works-head, .about-figure, .about-body, .contact-left, .contact-sheet"))
          .forEach((el) => gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { start: () => topOf(el) - vh() * 0.88, once: true, invalidateOnRefresh: true } }));

        // ── 2b. one screen at a time, without ever stopping the scroll itself, and never into the next room
        //       before the current room's pieces have all finished coming in.
        //       Wheel input is shaped before Lenis sees it: a flick can carry at most to the next room, and the rest of
        //       that flick is dropped. The page just eases into the room and rests there. A new push (after a short pause)
        //       goes on to the next one. Nothing is stopped, locked or re-aimed, so it stays as smooth as plain Lenis.
        const lenis = stage.lenis;
        let releaseStops: (() => void) | undefined;
        if (sheets && lenis) {
          const stopRooms = [me, toolkit, works, certs, contactRoom, stay];
          const measure = () => [0, ...stopRooms.map((r) => topOf(r) - NAV)];
          const roomAt = (i: number) => (i > 0 ? stopRooms[i - 1] : null);
          // a room is still arriving while any of its entrance animations has not finished
          const arriving = (r: HTMLElement | null) =>
            !!r && (intro.get(r) ?? []).some((a) => a.progress() < (a.scrollTrigger?.vars.scrub ? 0.95 : 1));
          const MAX_WAIT = 2500; // never hold anyone longer than this, whatever an animation is doing
          let heldAt = -1;
          let heldSince = 0;
          let stops = measure();
          const remeasure = () => (stops = measure());
          ScrollTrigger.addEventListener("refresh", remeasure);

          const blocked = () => document.documentElement.classList.contains("is-staying") || document.documentElement.classList.contains("is-modal");
          const waitingForMail = () => !!contactFlight && !contactFlight.reversed() && contactFlight.progress() < 1;
          const contactStop = () => stops[stopRooms.indexOf(contactRoom) + 1];
          const atContact = () => lenis.targetScroll >= contactStop() - 2;
          // Keyboard/native scrolling can bypass Lenis's virtual wheel handler.
          // Keep the sheet at its landing point until the fixed flyer hands over to the real image.
          const guardContactScroll = () => {
            if (!stage.autoScroll && !blocked() && waitingForMail() && lenis.actualScroll > contactStop() + 1) {
              lenis.scrollTo(contactStop(), { immediate: true });
            }
          };
          const guardContactKeys = (event: KeyboardEvent) => {
            const target = event.target;
            if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, button, [role='textbox']"))) return;
            const forward = event.key === "ArrowDown" || event.key === "PageDown" || event.key === "End" || (event.key === " " && !event.shiftKey);
            if (forward && !blocked() && atContact() && waitingForMail()) event.preventDefault();
          };
          const offContactScroll = lenis.on("scroll", guardContactScroll);
          window.addEventListener("keydown", guardContactKeys);
          const PAUSE = 150; // ms of quiet that counts as a new push
          let last = 0;
          let spent = false; // this push has already used up its room
          const prev = lenis.options.virtualScroll;
          lenis.options.virtualScroll = (data) => {
            if (!blocked() && data.deltaY > 0 && atContact() && waitingForMail()) {
              if (data.event.cancelable) data.event.preventDefault();
              last = performance.now();
              spent = true;
              return false;
            }
            if (stage.autoScroll || blocked()) return true;
            const now = performance.now();
            const fresh = now - last > PAUSE;
            last = now;
            if (data.deltaY <= 0) {
              spent = false; // going back up is never held
              return true;
            }
            if (fresh) spent = false;
            const y = lenis.targetScroll;

            // resting on a room whose pieces are still coming in: nothing moves on until they have
            const here = stops.findIndex((s) => Math.abs(s - y) <= 2);
            if (here >= 0 && arriving(roomAt(here))) {
              if (heldAt !== here) {
                heldAt = here;
                heldSince = now;
              }
              if (now - heldSince < MAX_WAIT) {
                if (data.event.cancelable) data.event.preventDefault();
                spent = true; // and this push is used up, so the next room needs a fresh one
                return false;
              }
            }

            if (spent) {
              if (data.event.cancelable) data.event.preventDefault();
              return false; // the tail of the same flick: swallow it
            }
            const next = stops.find((s) => s > y + 2);
            if (next === undefined) return true;
            if (data.deltaY >= next - y) {
              data.deltaY = next - y; // lands exactly on the room
              spent = true;
            }
            return true;
          };
          releaseStops = () => {
            lenis.options.virtualScroll = prev;
            ScrollTrigger.removeEventListener("refresh", remeasure);
            offContactScroll();
            window.removeEventListener("keydown", guardContactKeys);
          };
        }

        // ── 3. a red thread under the header for how far through the visit you are
        gsap.fromTo(q(".scroll-progress i"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

        // ── 4. things that answer the speed of the scroll: the side strips run faster (and backwards when you scroll up),
        //       the card grids lean a touch with the momentum
        const tracks = els(".side-track");
        tracks.forEach((tr) => (tr.style.animation = "none"));
        const lean = els(".toolkit, .works-grid, .certs-grid").map((g) => gsap.quickTo(g, "skewY", { duration: 0.6, ease: "power3" }));
        let offset = 0;
        const tick = (_time: number, dt: number) => {
          const v = stage.lenis?.velocity ?? 0;
          offset += (dt / 1000) * (36 + v * 9);
          tracks.forEach((tr, k) => {
            const half = tr.scrollHeight / 2;
            if (!half) return;
            const m = ((offset % half) + half) % half;
            tr.style.transform = `translate3d(0, ${k === 0 ? m - half : -m}px, 0)`;
          });
          const s = gsap.utils.clamp(-3, 3, v * 0.14);
          lean.forEach((f) => f(s));
        };
        gsap.ticker.add(tick);

        return () => {
          releaseStops?.();
          cleanups.forEach((f) => f());
          gsap.ticker.remove(tick);
          tracks.forEach((tr) => {
            tr.style.animation = "";
            tr.style.transform = "";
          });
        };
      },
    );
    return () => mm.revert();
  }, []);

  return (
    <RoomAssets><main ref={root} className="story">
      {/* the letter that flies in ahead of the contact room (moved by the scroll, hidden otherwise) */}
      <Image
        className="mail-flyer"
        data-asset-room="contact"
        src="/shared/mail-collage.png"
        width={1774}
        height={887}
        alt=""
        aria-hidden="true"
        sizes="40vw"
      />
      <div className="scroll-progress" aria-hidden="true">
        <i />
      </div>
      <section id="top" className="hero" aria-labelledby="hero-h">
        <h1 id="hero-h" className="sr-only">
          {profile.nickname}. {profile.name}, {profile.role} in {profile.location}. {profile.heroLine}
        </h1>
        {/* the whole opening is one illustrated poster, edge to edge */}
        <div className="hero-art">
          {(["down", "up"] as const).map((dir) => {
            // left runs the list backwards so what leaves the bottom on the left re-enters the bottom on the right
            const items = stack.flatMap((g) => g.items);
            const list = dir === "down" ? [...items].reverse() : items;
            return (
              <div key={dir} className={`side-marquee side-${dir}`} aria-hidden="true">
                <div className="side-track">
                  {[0, 1].map((k) =>
                    list.map((item) => (
                      <b key={`${k}${item}`}>
                        {item} <i>&#10022;</i>
                      </b>
                    )),
                  )}
                </div>
              </div>
            );
          })}
          <picture>
          <source media="(orientation: portrait)" srcSet="/optimized/hero/portrait.webp" />
          <Image
            className="hero-img"
            src={profile.heroArt.src}
            width={profile.heroArt.width}
            height={profile.heroArt.height}
            alt={profile.heroArt.alt}
            sizes="(max-width: 860px) 90vw, 100vw"
            preload
          />
          </picture>
        </div>
      </section>

      <section id="me" className="room about-room" aria-labelledby="me-h">
        <Image
          className="about-robots"
          src={profile.aboutArt.src}
          width={profile.aboutArt.width}
          height={profile.aboutArt.height}
          alt=""
          aria-hidden="true"
          sizes="(max-width: 860px) 85vw, 32vw"
        />
        <span className="torn torn-yellow" aria-hidden="true" />
        <span className="dots" aria-hidden="true" />
        <header className="about-head" data-reveal>
          <p className="eyebrow">01 / About me</p>
          <h2 id="me-h" className="about-title">
            <Words text="The person" /> <span className="hl"><Words text="behind the code." /></span>
          </h2>
        </header>
        <div className="about">
          <figure className="about-figure" data-reveal>
            <Image
              className="about-cutout"
              src={profile.portrait.src}
              width={profile.portrait.width}
              height={profile.portrait.height}
              alt={profile.portrait.alt}
              sizes="(max-width: 860px) 80vw, 38vw"
            />
            <figcaption className="caption">
              {profile.city}, {profile.location}
            </figcaption>
          </figure>
          <div className="about-body" data-reveal>
            <p className="eyebrow">Software &amp; AI engineer</p>
            <h3 className="about-hi">
              こんにちは、僕は {profile.name}。{profile.nickname}と呼んで.
            </h3>
            <div className="prose">
              {profile.bio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <dl className="facts">
              {profile.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="tags">
              {profile.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <div className="about-actions">
              <a
                className="btn btn-accent"
                href="#projects"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("projects");
                }}
              >
                Explore my work <Icon name="out" size={16} />
              </a>
              <a
                className="link about-talk"
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("contact");
                }}
              >
                <span>Let&rsquo;s talk</span> <Icon name="out" size={16} className="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="stack" className="room stack-room" aria-labelledby="stack-h">
        <header className="about-head" data-reveal>
          <p className="eyebrow">02 / My toolkit</p>
          <h2 id="stack-h" className="about-title stack-title">
            <Words text="What I" /> <span className="hl"><Words text="build with." /></span>
          </h2>
        </header>
        <ol className="toolkit">
          {stack.map((g) => (
            <li key={g.group} className="tool-card" data-reveal>
              <Image
                src={g.card.src}
                width={g.card.width}
                height={g.card.height}
                alt={`${g.group}: ${g.items.join(", ")}`}
                sizes="(max-width: 860px) 92vw, 34vw"
              />
            </li>
          ))}
        </ol>
        <p className="room-foot">Tools change. Curiosity stays.</p>
      </section>

      <section id="projects" className="room works-room" aria-labelledby="projects-h">
        <header className="works-head" data-reveal>
          <p className="eyebrow">03 / Selected works</p>
          <div className="works-titlebar">
            <h2 id="projects-h" className="about-title works-title">
              <Words text="Things I’ve" /> <span className="hl"><Words text="made." /></span>
            </h2>
            <Image
              className="works-note"
              src="/projects/title-label.png"
              width={2170}
              height={725}
              alt="Experiments, products & systems."
              sizes="(max-width: 860px) 70vw, 26vw"
            />
          </div>
        </header>
        <ol className="works-grid">
          {projects.map((p, i) => {
            const f = FRAMES[i % FRAMES.length];
            const [x, y, w, h] = f.win;
            const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
            return (
              <li key={p.title} className="work-card" data-reveal>
                <picture>
                  <source media="(max-width: 600px)" srcSet={`/optimized/projects/frame-portrait-${i % 4 + 1}.webp`} />
                  <Image className="work-frame" src={f.src} alt="" fill sizes="(max-width: 860px) 92vw, 48vw" aria-hidden="true" />
                </picture>
                <article className="work-body" aria-labelledby={`work${i}-h`}>
                  <div className="work-art" style={{ left: pct(x - 0.006), top: pct(y - 0.012), width: pct(w + 0.012), height: pct(h + 0.024) }}>
                    {p.video ? (
                      <WorkVideo src={p.video.src} title={p.title} onOpen={() => setOpenVideo(i)} />
                    ) : p.art ? (
                      <Image src={p.art.src} width={p.art.width} height={p.art.height} alt={`${p.title}, project illustration`} sizes="(max-width: 860px) 40vw, 22vw" />
                    ) : (
                      <ProjectPainting seed={p.title} color={ART[i % ART.length]} label={`Abstract painting for ${p.title}`} />
                    )}
                    <span className="work-no">{pad(i + 1)}</span>
                  </div>
                  <div className="work-label">
                    <h3 id={`work${i}-h`} className="work-title">
                      {p.title}
                      {p.mock && <Sample />}
                    </h3>
                    <p className="work-meta">
                      <span>{p.year}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>{p.role}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span className={`status status-${p.status.replace(" ", "-")}`}>{p.status}</span>
                    </p>
                    <p className="work-blurb">{p.blurb}</p>
                    <p className="work-medium">{p.stack.join(" \u00b7 ")}</p>
                    <div className="work-links">
                      {p.repo && (
                        <button type="button" className="work-code" aria-haspopup="dialog" onClick={() => setOpenRepo(i)}>
                          <Icon name="code" size={15} /> Code
                        </button>
                      )}
                      {p.links.map((l) => (
                        <LinkOrSoon key={l.label} href={l.href} label={l.label} />
                      ))}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
        <p className="room-foot">Built with curiosity.</p>
      </section>

      <section id="certificates" className="room certs-room" aria-labelledby="certificates-h">
        <header className="works-head" data-reveal>
          <p className="eyebrow">04 / The collection</p>
          <div className="works-titlebar">
            <div>
              <h2 id="certificates-h" className="about-title works-title">
                <Words text="Always" /> <span className="hl"><Words text="learning." /></span>
              </h2>
              <p className="certs-sub">Certificates &amp; milestones</p>
            </div>
            <Image
              className="certs-note"
              src="/certificates/book-microchip.png"
              width={1983}
              height={793}
              alt=""
              aria-hidden="true"
              sizes="(max-width: 860px) 70vw, 26vw"
            />
          </div>
        </header>
        <ol className="certs-grid">
          {certificates.map((c, i) => (
            <li key={c.name} className="cert-card" data-reveal>
              <Image
                src={c.card.src}
                width={c.card.width}
                height={c.card.height}
                alt={`${c.name}, ${c.issuer}`}
                sizes="(max-width: 860px) 92vw, 38vw"
              />
              {/* the picture carries the "View certificate" button; this puts a real button on top of it */}
              <button
                type="button"
                className="cert-hit"
                aria-haspopup="dialog"
                aria-label={`View certificate: ${c.name}`}
                onClick={() => setOpenCert(i)}
              />
            </li>
          ))}
        </ol>
        <p className="room-foot">Learning, one step at a time.</p>
        {openCert !== null && <CertModal cert={certificates[openCert]} onClose={closeCert} />}
        {openRepo !== null && projects[openRepo].repo && (
          <RepoModal title={projects[openRepo].title} repo={projects[openRepo].repo!} onClose={closeRepo} />
        )}
        {openVideo !== null && projects[openVideo].video && (
          <VideoModal title={projects[openVideo].title} src={projects[openVideo].video!.src} onClose={closeVideo} />
        )}
      </section>

      <section id="contact" className="room contact-room" aria-labelledby="contact-h">
        <div className="contact-left">
          <p className="eyebrow" data-reveal>
            05 / Visitor desk
          </p>
          <h2 id="contact-h" className="sr-only">
            Say hello.
          </h2>
          <div className="contact-hello">
            <Image
              className="hello-word"
              src="/contact/say-hello.png"
              width={1580}
              height={995}
              alt=""
              aria-hidden="true"
              sizes="(max-width: 860px) 85vw, 32vw"
            />
            <Image
              className="hello-blossom"
              src="/shared/cherry-blossom.png"
              width={1536}
              height={1024}
              alt=""
              aria-hidden="true"
              sizes="(max-width: 860px) 70vw, 26vw"
            />
          </div>
          <p className="contact-lead" data-reveal>
            Thanks for stopping by. Internships, freelance work, or just a good song &mdash; I&rsquo;d love to hear from you.
          </p>
          <Image
            className="contact-mail"
            src="/shared/mail-collage.png"
            width={1774}
            height={887}
            alt="An envelope and a paper plane: let's make something useful."
            sizes="(max-width: 860px) 90vw, 36vw"
          />
        </div>
        <div className="contact-sheet">
          <Image
            src="/contact/contact-sheet.png"
            width={1254}
            height={1254}
            alt="Find me here: email, GitHub, LinkedIn, résumé."
            sizes="(max-width: 860px) 92vw, 44vw"
          />
          {/* the picture carries the names; these sit on its rows to say what each one does */}
          <ul className="contact-rows">
            {[{ label: "Email", href: contact.email ? `mailto:${contact.email}` : "" }, ...contact.links].map((l, i) => {
              const live = !!l.href && l.href !== "#";
              const external = live && l.href.startsWith("http");
              const inner = live ? (
                <Icon name="out" size={26} />
              ) : (
                <span className="row-soon">{i === 0 ? "Coming soon" : "Soon"}</span>
              );
              return (
                <li key={l.label} className={`contact-row row-${i}`}>
                  {live ? (
                    <a
                      className="row-hit"
                      href={l.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      aria-label={l.label}
                    >
                      {inner}
                    </a>
                  ) : (
                    <span className="row-hit" aria-label={`${l.label}, coming soon`}>
                      {inner}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="room-foot contact-foot">
          <span>
            <strong>FIZZ STUDIO</strong> <i aria-hidden="true">|</i> Made with curiosity.
          </span>
          <a
            href="#top"
            className="link"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("top");
            }}
          >
            <span>Back to top</span> <Icon name="down" size={14} className="up" />
          </a>
        </p>
      </section>

      <section id="stay" className="room stay-room" aria-labelledby="stay-h">
        <div className="stay-left">
          <p className="eyebrow" data-reveal>
            The reading room
          </p>
          <Image
            className="stay-nook"
            src="/stay/reading-nook.png"
            width={1536}
            height={1024}
            alt="A cosy reading nook on a rainy night: an armchair with a blanket, a lamp, a radio and an open book by the window."
            sizes="(max-width: 860px) 92vw, 50vw"
          />
          <p className="stay-caption">
            <span className="dots dots-inline" aria-hidden="true" />A little space to slow down.
          </p>
        </div>
        <div className="stay-right">
          <div className="stay-head">
            <h2 id="stay-h" className="stay-title">
              <Words text="Or just" /> <span className="hl"><Words text="stay a while." /></span>
            </h2>
            <Image
              className="stay-blossom"
              src="/shared/cherry-blossom.png"
              width={1536}
              height={1024}
              alt=""
              aria-hidden="true"
              sizes="(max-width: 860px) 40vw, 22vw"
            />
          </div>
          <p className="stay-lead">Sit in front of a painting. Listen to the rain, tune into lo-fi, or settle in for a focused session.</p>
          <ul className="stay-feats">
            {[
              { src: "/stay/rain-icon.png", label: "Rain sounds" },
              { src: "/stay/radio-icon.png", label: "Lo-fi radio" },
              { src: "/stay/timer-icon.png", label: "Focus timer" },
            ].map((f) => (
              <li key={f.label} className="stay-feat">
                <span className="feat-icon">
                  <Image src={f.src} width={1254} height={1254} alt="" aria-hidden="true" sizes="120px" />
                </span>
                <span className="feat-label">{f.label}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-accent stay-btn" onClick={openStay}>
            <Icon name="cup" size={20} /> Take a seat <Icon name="out" size={18} />
          </button>
          <Image
            className="stay-note"
            src="/stay/no-rush.png"
            width={2172}
            height={724}
            alt="No rush. Make yourself at home."
            sizes="(max-width: 860px) 80vw, 30vw"
          />
          <Image
            className="stay-collage"
            src="/stay/book-headphones.png"
            width={1994}
            height={789}
            alt=""
            aria-hidden="true"
            sizes="(max-width: 860px) 85vw, 32vw"
          />
        </div>
        <p className="room-foot stay-foot">
          <span>
            <strong>FIZZ STUDIO</strong> <i aria-hidden="true">/</i> The quiet corner
          </span>
        </p>
      </section>

      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} {profile.name} ({profile.nickname}). Built with Next.js, GSAP and Lenis.
          Every painting here is drawn in code.
        </p>
        <a
          className="link"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("top");
          }}
        >
          Back to the entrance
        </a>
      </footer>
    </main></RoomAssets>
  );
}
