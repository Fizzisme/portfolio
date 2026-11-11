import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";
import { imageAsset } from "@/lib/image-assets";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" aria-label="Fizz, back to home">
          <Image src={imageAsset("/shared/fizz-wordmark.png")} alt="" width={2172} height={724} className={styles.logo} sizes="180px" />
        </Link>
        <span>AN UNEXPECTED DETOUR</span>
      </header>

      <div className={styles.content}>
        <Image className={styles.poster} src={imageAsset("/not-found/door.png")} width={1254} height={1254}
          alt="404: an open blue door in torn lavender paper, with a key and a Room not found stamp."
          sizes="(max-width: 760px) 92vw, (max-width: 1700px) 52vw, 850px" preload />

        <div className={styles.message}>
          <span className={styles.note}>A LITTLE LOST?</span>
          <h1>This room<br />is off<br /><em>the map.</em></h1>
          <p>The page you&apos;re looking for isn&apos;t here.<br className={styles.desktopBreak} /> Let&apos;s get you back somewhere familiar.</p>
          <Link className={styles.home} href="/">
            <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true"><path d="M32 13H5m8-8-8 8 8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="square" /></svg>
            Back to the exhibition
          </Link>
          <Image className={styles.quote} src={imageAsset("/not-found/quote.png")} width={2172} height={724}
            alt="Good things are still this way." sizes="(max-width: 760px) 92vw, 40vw" loading="eager" />
        </div>
      </div>

      <footer className={styles.footer}><span>FIZZ / PORTFOLIO</span><span>ERROR 404</span></footer>
    </main>
  );
}
