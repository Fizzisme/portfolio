# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript. Scroll storytelling with Lenis (smooth scroll) and GSAP (ScrollTrigger). Chosen by the owner.

## Users

Everyone who lands on a personal developer portfolio, with recruiters first:

- Recruiters / tech leads evaluating an intern or fresher candidate: need to know who this is, what they build with, and how to contact them, quickly.
- Potential freelance clients: need to see shipped projects and a way to reach out.
- Dev community and friends: browse for fun, linger, share.

## Product Purpose

A personal portfolio for Phi ("Fizz"), a Software Engineering student in Vietnam. It introduces the person, shows their tech stack, projects, and certificates, and tells that as a scroll-driven story rather than a static résumé. Success: a visitor finishes the scroll remembering who Fizz is and knows how to contact them; some stay in the chill workspace corner just to relax.

## Positioning

A portfolio you inhabit, not one you skim: the owner's own pixel/indie world, told as a story on scroll, with a lo-fi workspace where visitors can stay and listen to chill music.

## Operating Context

Visited on desktop (recruiters at work, devs browsing) and mobile (links shared in chat/social). Visits range from a 30-second skim to a long idle session with music playing.

## Capabilities and Constraints

Required sections, in order: portrait photo of the owner, intro/bio, tech stack, projects, certificates. Additional sections may be suggested.

- Scroll storytelling with Lenis + GSAP is required.
- A relaxing "workspace" with chill music is requested (references: jarnket.com, buche.dev).
- Projects use mock data for now, to be replaced later.
- Music must never autoplay with sound; the visitor opts in.

## Brand Commitments

- Pixel / indie aesthetic (owner-pinned).
- Owner name: Phi, nickname Fizz.
- References the owner named: https://www.jarnket.com/, https://buche.dev/?node=Home&room=LivingRoom

## Evidence on Hand

- Owner has a real name, bio, and certificate list (to be supplied; not yet in repo).
- No portrait photo in repo yet; placeholder must be clearly marked for replacement.
- No real project data yet; projects are mock and must be labeled as such in the content file.
- No testimonials, clients, or metrics exist; do not fabricate them.

## Product Principles

1. Personality first, but the facts (who, stack, work, contact) are never more than one scroll away.
2. Story over list: each section is a chapter that earns the next.
3. Invite lingering: the workspace corner is a place, not a widget.
4. All content lives in one data file so the owner can update it without touching components.

## Accessibility & Inclusion

Respect `prefers-reduced-motion` (storytelling degrades to plain reveal). Audio is opt-in with visible controls. Pixel fonts are used for display only; body copy stays readable.
