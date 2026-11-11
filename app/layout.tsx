import type { Metadata, Viewport } from "next";
import { Albert_Sans, Zen_Kaku_Gothic_New } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

/** Japanese-first typeface whose Latin letters are built to sit next to kana and kanji. */
const jp = Zen_Kaku_Gothic_New({ subsets: ["latin"], weight: ["900"], variable: "--f-jp", display: "swap", preload: false });

const sans = Albert_Sans({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Fizz | Software & AI Engineer",
  description:
    "Portfolio of Phi (Fizz), a software engineering student in Vietnam, hung like a small exhibition: stack, selected works, certificates, and lo-fi to stay for.",
};

export const viewport: Viewport = {
  themeColor: "#fbe4cf",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${jp.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: "try{if(performance.getEntriesByType('navigation')[0]?.type==='reload'){var s=document.createElement('style');s.textContent='.preloader{display:none!important}';document.head.appendChild(s)}}catch(e){}" }} /></head>
      <body><noscript><style>{'.preloader, [data-asset-ready="false"] { display: none !important; }'}</style></noscript>{children}</body>
    </html>
  );
}
