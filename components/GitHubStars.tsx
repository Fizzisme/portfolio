"use client";

import { useEffect, useState, type SVGProps } from "react";
import { GithubStars, GithubStarsIcon, GithubStarsLogo, GithubStarsNumber } from "@animate-ui/react/primitives/github-stars";

const REPOSITORY = "https://github.com/Fizzisme/portfolio";

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true" {...props}><path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.4l-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z" /></svg>;
}

export function GitHubStars() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const refresh = async () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("https://api.github.com/repos/Fizzisme/portfolio", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const data: { stargazers_count?: unknown } = await response.json();
        if (active && typeof data.stargazers_count === "number") setCount(data.stargazers_count);
      } catch { /* Keep the last known count if GitHub is unavailable. */ }
    };
    void refresh();
    const timer = window.setInterval(refresh, 120000);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; controller?.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  return <a className="github-stars-link" href={REPOSITORY} target="_blank" rel="noopener noreferrer" aria-label={count === null ? "Star Fizz's portfolio on GitHub" : `Star Fizz's portfolio on GitHub, ${count} stars`}>
    {count === null ? <><GithubStarsLogo className="github-stars-logo" /><StarIcon className="github-stars-star" /><span>Star</span></> :
      <GithubStars value={count} className="github-stars-inner"><GithubStarsLogo className="github-stars-logo" /><GithubStarsIcon icon={StarIcon} className="github-stars-star" color="#f4b918" /><GithubStarsNumber padStart={false} /></GithubStars>}
  </a>;
}
