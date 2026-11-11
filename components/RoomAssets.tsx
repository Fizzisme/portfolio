"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import NextImage, { type ImageProps } from "next/image";
import { imageAsset } from "@/lib/image-assets";

const LoadedRooms = createContext<ReadonlySet<string>>(new Set(["top"]));
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export function useRoomAssetsReady(id: string) {
  return useContext(LoadedRooms).has(id);
}

/** Schedule by document layout, because pinned/transformed sections fool viewport lazy loading. */
export function RoomAssets({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set(["top"]));

  useEffect(() => {
    const rooms = Array.from(document.querySelectorAll<HTMLElement>(".story > section, .story > .pin-spacer > section"));
    let frame = 0;
    let started = !document.querySelector('.preloader[data-phase="loading"]');
    const activate = (ids: string[]) => setLoaded(previous => {
      if (ids.every(id => previous.has(id))) return previous;
      return new Set([...previous, ...ids]);
    });
    const layoutTop = (room: HTMLElement) => {
      let node: HTMLElement | null = room.parentElement?.classList.contains("pin-spacer") ? room.parentElement : room;
      let top = 0;
      while (node) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return top;
    };
    const update = () => {
      frame = 0;
      if (!started) return;
      let current = 0;
      rooms.forEach((room, index) => {
        if (layoutTop(room) <= window.scrollY + window.innerHeight * 0.45) current = index;
      });
      activate(rooms.slice(current, current + 2).map(room => room.id));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const openingReady = () => { started = true; schedule(); };
    const requested = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      const index = rooms.findIndex(room => room.id === id);
      if (index >= 0) activate(rooms.slice(index, index + 2).map(room => room.id));
    };
    window.addEventListener("portfolio:opening-ready", openingReady);
    window.addEventListener("portfolio:room-request", requested);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("portfolio:opening-ready", openingReady);
      window.removeEventListener("portfolio:room-request", requested);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <LoadedRooms.Provider value={loaded}>{children}</LoadedRooms.Provider>;
}

/** Keep the image element and its dimensions in place for GSAP; defer the actual network source. */
export function RoomImage(props: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [room, setRoom] = useState<string | null>();
  const loaded = useContext(LoadedRooms);
  useEffect(() => {
    const image = ref.current;
    setRoom(image?.dataset.assetRoom ?? image?.closest("section.room")?.id ?? null);
  }, []);
  const ready = props.preload || props.priority || room === null || (room !== undefined && loaded.has(room));
  const src = typeof props.src === "string" ? imageAsset(props.src) : props.src;
  return <><NextImage {...props} ref={ref} src={ready ? src : EMPTY_IMAGE}
    unoptimized={!ready || props.unoptimized} loading={props.preload || props.priority ? undefined : ready ? "eager" : "lazy"}
    data-asset-ready={ready ? "true" : "false"} />
    {!props.preload && !props.priority && <noscript><NextImage {...props} src={src} loading="lazy" /></noscript>}
  </>;
}
