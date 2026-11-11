/**
 * Everything the site says lives here. Edit this file, not the components.
 *
 * Anything marked `mock: true` renders with a small "SAMPLE" stamp so a
 * visitor never mistakes placeholder data for the real thing. Replace the
 * entry and delete the flag when you have the real one.
 */

export type StackGroup = {
  group: string;
  /** Cartridge colour on the shelf and on the page. */
  color: string;
  items: string[];
  /** The illustrated card for this group, in /public. */
  card: { src: string; width: number; height: number };
};

export type Project = {
  title: string;
  year: string;
  role: string;
  blurb: string;
  stack: string[];
  status: "shipped" | "in progress" | "archived";
  /** Note colour on the corkboard. */
  color: string;
  links: { label: string; href: string }[];
  mock?: boolean;
  /** Optional illustration in /public. Without it the card gets a painting generated in code. */
  art?: { src: string; width: number; height: number };
  /** A demo video in /public. It plays muted in the card and opens full size on click. */
  video?: { src: string };
  /** A public GitHub repository: "Code" opens its live file tree, read from this branch. */
  repo?: { owner: string; name: string; branch: string };
};

export type Certificate = {
  name: string;
  issuer: string;
  year?: string;
  /** The certificate itself, shown in a popup. Drop the file in /public and fill this in; until then the popup says it is coming. */
  image?: { src: string; width: number; height: number };
  mock?: boolean;
  /** The illustrated card for this certificate, in /public. The card carries its own title and button. */
  card: { src: string; width: number; height: number };
};

export const profile = {
  name: "Phi",
  nickname: "Fizz",
  role: "Software engineering student",
  location: "Vietnam",
  city: "Pleiku",
  /** The cut-out portrait for the About room, in /public. Keep width/height in step with the file. */
  portrait: {
    src: "/about/portrait.png",
    width: 1086,
    height: 1448,
    alt: "Illustrated portrait of Phi reading a book, on torn purple paper, labelled Phi, aka Fizz",
  },
  /** The full-width illustrated hero poster, in /public. Keep width/height in step with the file. */
  heroArt: {
    src: "/hero/ideas-to-systems.png",
    width: 1672,
    height: 941,
    alt: "Poster of Fizz, software and AI engineer: a black FIZZ headline, the line I build ideas, and a portrait in front of a red sun with code windows and AI diagrams",
  },
  /** Decorative collage in the top-right corner of the About room. */
  aboutArt: {
    src: "/about/agent-collage.png",
    width: 1536,
    height: 1024,
  },
  heroLine:
    "I build web things in a small room, mostly at night. Come in, look around, stay for the music.",
  bio: [
    "I’m a software engineering student in Vietnam, building software and AI systems from interface to infrastructure.",
    "My focus: reliable software, multi-agent systems, and the harnesses that make agents useful.",
  ],
  facts: [
    { label: "Based in", value: "Pleiku, Vietnam" },
    { label: "Exploring", value: "Agent systems & software architecture" },
    { label: "Open to", value: "Internships & collaborations" },
  ],
  tags: ["Software", "AI agents", "Systems"],
};

export const stack: StackGroup[] = [
  {
    group: "Languages",
    color: "#2b58ff",
    items: ["TypeScript", "JavaScript", "Python", "Go"],
    card: { src: "/stack/languages.png", width: 1536, height: 1024 },
  },
  {
    group: "Frontend",
    color: "#ff4d36",
    items: ["Zustand", "Lenis", "GSAP", "Next.js", "Tailwind CSS"],
    card: { src: "/stack/frontend.png", width: 1536, height: 1024 },
  },
  {
    group: "Backend",
    color: "#ffd741",
    items: ["Node.js", "NestJS", "Gin", "FastAPI", "Prisma", "Microservices"],
    card: { src: "/stack/backend.png", width: 1536, height: 1024 },
  },
  {
    group: "AI",
    color: "#b8f33b",
    items: ["LangChain", "PyTorch", "Transformers", "vLLM"],
    card: { src: "/stack/ai.png", width: 1536, height: 1024 },
  },
  {
    group: "Data & infra",
    color: "#2b58ff",
    items: ["PostgreSQL", "MongoDB", "Redis", "RabbitMQ", "Docker", "Kubernetes", "Azure"],
    card: { src: "/stack/data-infrastructure.png", width: 1536, height: 1024 },
  },
  {
    group: "Tools",
    color: "#ff4d36",
    items: ["Claude Code", "Git", "GitHub Actions"],
    card: { src: "/stack/tools.png", width: 1536, height: 1024 },
  },
];

export const projects: Project[] = [
  {
    title: "Marginalleya",
    year: "2026",
    role: "Full-stack & Cloud",
    blurb: "A used and rare bookshop where every copy is unique, with a lock so two buyers can't take the same book.",
    stack: ["Next.js", "Go", "gRPC", "Microservices", "SQL Server", "Azure"],
    status: "in progress",
    color: "#7fd1b9",
    video: { src: "/projects/marginalleya-demo.mp4" },
    repo: { owner: "23521155", name: "cloud-e-commerce", branch: "develop" },
    links: [{ label: "GitHub", href: "https://github.com/23521155/cloud-e-commerce" }],
  },
  {
    title: "Finsights",
    year: "2026",
    role: "FE & AI development",
    blurb: "An AI-powered financial news and market analysis system, leveraging Agentic RAG with Python and LangChain.",
    stack: ["Python", "LangChain", "JEV"],
    status: "in progress",
    color: "#8a99f2",
    art: { src: "/optimized/projects/finsights.webp", width: 1200, height: 674 },
    repo: { owner: "Fizzisme", name: "finsights-ai-service", branch: "main" },
    links: [
      { label: "Website", href: "https://finsights-frontend-gray.vercel.app/" },
      { label: "GitHub", href: "https://github.com/Fizzisme/finsights-ai-service" },
    ],
  },
  {
    title: "Lantern Market",
    year: "2025",
    role: "Full-stack",
    blurb: "A storefront and mobile-friendly dashboard for small handmade shops.",
    stack: ["Next.js", "NestJS", "PostgreSQL"],
    status: "shipped",
    color: "#f2a65a",
    links: [
      { label: "Live", href: "#" },
      { label: "Code", href: "#" },
    ],
    mock: true,
  },
  {
    title: "Ferry",
    year: "2025",
    role: "Backend",
    blurb: "A ride-booking backend with independent services and messaging.",
    stack: ["NestJS", "Microservices", "PostgreSQL", "RabbitMQ", "Docker"],
    status: "in progress",
    color: "#8a99f2",
    links: [{ label: "Code", href: "#" }],
    mock: true,
  },
];

// TODO(Fizz): add the year and a credential link to each if you have them.
export const certificates: Certificate[] = [
  {
    name: "JLPT N3",
    issuer: "Japan Foundation",
    image: { src: "/certificates/jlpt-n3-certificate.png", width: 1086, height: 1448 },
    card: { src: "/certificates/jlpt-n3-card.png", width: 1402, height: 1122 },
  },
  {
    name: "AI on AMD",
    issuer: "AMD",
    image: { src: "/certificates/amd-ai-certificate.png", width: 742, height: 547 },
    card: { src: "/certificates/ai-on-amd-card.png", width: 1402, height: 1122 },
  },
];

/**
 * Links left as "#" render as "coming soon" instead of a dead link.
 * TODO(Fizz): add your email (null hides it) and real links.
 */
export const contact = {
  email: null as string | null,
  links: [
    { label: "GitHub", href: "https://github.com/Fizzisme", icon: "code" as const },
    { label: "LinkedIn", href: "#", icon: "person" as const },
    { label: "Résumé (PDF)", href: "#", icon: "doc" as const },
  ],
};
