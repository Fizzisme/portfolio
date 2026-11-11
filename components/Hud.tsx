"use client";

import Image from "next/image";
import { scrollToId } from "@/lib/stage";
import { Icon } from "./Icon";
import { openStay } from "./ChillRoom";
import { imageAsset } from "@/lib/image-assets";
import { GitHubStars } from "./GitHubStars";

const NAV = [
  { id: "me", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "projects", label: "Works" },
  { id: "certificates", label: "Certificates" },
  { id: "contact", label: "Contact" },
];

export function Hud() {
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <header className="hud">
      <a href="#top" className="hud-logo" onClick={go("top")} aria-label="Fizz, back to top">
        <Image
          className="hud-wordmark"
          src={imageAsset("/shared/fizz-wordmark.png")}
          width={2172}
          height={724}
          alt="Fizz"
          sizes="160px"
        />
        <Image className="hud-monogram" src="/icon.png" width={40} height={40} alt="" aria-hidden="true" />
      </a>
      <nav className="hud-nav" aria-label="Rooms">
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}>
            {n.label}
          </a>
        ))}
      </nav>
      <div className="hud-actions"><GitHubStars /><button type="button" className="btn btn-small btn-accent" onClick={openStay}>
        <Icon name="cup" size={14} /> Stay a while
      </button></div>
    </header>
  );
}
