import type { ReactNode } from "react";

const PATHS = {
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  next: <path d="M6 6l8 6-8 6zM17.5 6v12" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  out: <path d="M7 17L17 7M9 7h8v8" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.8 6.8L12 13l8.2-6.2" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  volume: <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />,
  rain: <path d="M7 15.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.2 9a3.3 3.3 0 0 1-.2 6.5M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" />,
  vinyl: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 2M10 3h4" />
    </>
  ),
  cup: <path d="M5 9h11v4.5A5.5 5.5 0 0 1 10.5 19h0A5.5 5.5 0 0 1 5 13.5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2.5M12 3.5v2.5" />,
  code: <path d="M9 7.5L4.5 12 9 16.5M15 7.5l4.5 4.5-4.5 4.5" />,
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  doc: <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 15.5h5" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
