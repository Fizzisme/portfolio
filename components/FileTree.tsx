"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { stage } from "@/lib/stage";
import { Icon } from "./Icon";

/**
 * A project's source tree, read live from GitHub, in the page's own paper-and-ink style.
 * Behaves like animate-ui's Files (the one used in WebFi_FE): several folders open at once, content slides open,
 * the folder icon swaps with a small pop, and a highlight glides to whichever row the pointer is on.
 */

export type Repo = { owner: string; name: string; branch: string };

type Node = { name: string; path: string; folder: boolean; children: Node[] };

/** Same idea as WebFi_FE's buildFileTree, plus folders first and names sorted. */
function buildTree(paths: string[]): Node[] {
  const root: Node = { name: "", path: "", folder: true, children: [] };
  for (const p of paths) {
    let cur = root;
    const parts = p.split("/");
    parts.forEach((part, i) => {
      const folder = i < parts.length - 1;
      let next = cur.children.find((c) => c.name === part && c.folder === folder);
      if (!next) {
        next = { name: part, path: parts.slice(0, i + 1).join("/"), folder, children: [] };
        cur.children.push(next);
      }
      cur = next;
    });
  }
  const sort = (n: Node) => {
    n.children.sort((a, b) => (a.folder === b.folder ? a.name.localeCompare(b.name) : a.folder ? -1 : 1));
    n.children.forEach(sort);
  };
  sort(root);
  return root.children;
}

/** A small printed tag per file type, instead of an icon set. */
const KINDS: [RegExp, string, string][] = [
  [/\.tsx$|\.jsx$/i, "TSX", "#5fb3ff"],
  [/\.ts$/i, "TS", "#2b58ff"],
  [/\.m?js$/i, "JS", "#ffd741"],
  [/\.go$/i, "GO", "#38c6d9"],
  [/\.py$/i, "PY", "#b8f33b"],
  [/\.proto$/i, "PB", "#cdb2ec"],
  [/\.sql$/i, "SQL", "#ff9f5a"],
  [/\.json$/i, "{}", "#f5f0e8"],
  [/\.ya?ml$/i, "YML", "#ff4d36"],
  [/\.md$/i, "MD", "#fffdf8"],
  [/\.css$/i, "CSS", "#7fa5ff"],
  [/\.bicep$/i, "BIC", "#5fb3ff"],
  [/^dockerfile$|\.dockerfile$/i, "DKR", "#38c6d9"],
  [/\.(png|jpe?g|svg|ico|webp|gif)$/i, "IMG", "#ffa496"],
  [/^\.(git|docker)ignore$|^\.env/i, "CFG", "#d9d0c2"],
];
const kindOf = (name: string) => KINDS.find(([re]) => re.test(name)) ?? [null, "TXT", "#ece4d6"];

function FolderGlyph({ open }: { open: boolean }) {
  return (
    <svg key={open ? "o" : "c"} className="ft-folder" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      {open ? (
        <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h13.3a1.5 1.5 0 0 0 1.45-1.1L21.5 11H7.2a1.5 1.5 0 0 0-1.43 1.04L3.5 19M3 7.5V6A1.5 1.5 0 0 1 4.5 4.5h4l2 2.5h7a1.5 1.5 0 0 1 1.5 1.5V11" />
      ) : (
        <path d="M3 6A1.5 1.5 0 0 1 4.5 4.5h4l2 2.5h9A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />
      )}
    </svg>
  );
}

type RowsProps = { nodes: Node[]; open: Set<string>; toggle: (p: string) => void; selected: string | null; onSelect: (p: string) => void };

function Rows({ nodes, open, toggle, selected, onSelect }: RowsProps) {
  return (
    <ul className="ft-list" role="group">
      {nodes.map((n) =>
        n.folder ? (
          <li key={n.path} role="treeitem" aria-expanded={open.has(n.path)}>
            <button type="button" className="ft-row ft-dir" onClick={() => toggle(n.path)}>
              <FolderGlyph open={open.has(n.path)} />
              <span className="ft-name">{n.name}</span>
            </button>
            <div className="ft-sub" data-open={open.has(n.path)}>
              {/* always rendered (inert while closed), so a folder slides shut as smoothly as it slides open */}
              <div className="ft-sub-inner" inert={!open.has(n.path)}>
                <Rows nodes={n.children} open={open} toggle={toggle} selected={selected} onSelect={onSelect} />
              </div>
            </div>
          </li>
        ) : (
          <li key={n.path} role="treeitem" aria-selected={selected === n.path}>
            <button type="button" className="ft-row ft-file" data-selected={selected === n.path} onClick={() => onSelect(n.path)}>
              <i className="ft-kind" style={{ background: kindOf(n.name)[2] }}>
                {kindOf(n.name)[1]}
              </i>
              <span className="ft-name">{n.name}</span>
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; tree: Node[]; count: number };

export function FileTree({ repo, selected, onSelect }: { repo: Repo; selected: string | null; onSelect: (p: string) => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const box = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${repo.branch}?recursive=1`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "GitHub is rate-limiting requests right now." : `GitHub answered ${res.status}.`);
        return res.json() as Promise<{ tree: { path: string; type: string }[] }>;
      })
      .then((data) => {
        if (!alive) return;
        const paths = data.tree.filter((t) => t.type === "blob").map((t) => t.path);
        const tree = buildTree(paths);
        setState({ status: "ready", tree, count: paths.length });
        // open the top level, and apps/ if there is one, so the shape of the project is visible straight away
        setOpen(new Set(tree.filter((n) => n.folder && n.name === "apps").map((n) => n.path)));
      })
      .catch((e: unknown) => alive && setState({ status: "error", message: e instanceof Error ? e.message : "Could not reach GitHub." }));
    return () => {
      alive = false;
    };
  }, [repo.owner, repo.name, repo.branch]);

  const toggle = useCallback((p: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  // the highlight glides to the row under the pointer
  const onMove = (e: MouseEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>(".ft-row");
    const b = box.current;
    const g = glow.current;
    if (!b || !g) return;
    if (!row) {
      g.style.opacity = "0";
      return;
    }
    const top = row.getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop;
    g.style.opacity = "1";
    g.style.transform = `translateY(${top}px)`;
    g.style.height = `${row.offsetHeight}px`;
  };

  return (
    <div
      ref={box}
      className="ft"
      role="tree"
      aria-label={`${repo.name} source tree`}
      data-lenis-prevent
      onMouseMove={onMove}
      onMouseLeave={() => glow.current && (glow.current.style.opacity = "0")}
    >
      <div ref={glow} className="ft-glow" aria-hidden="true" />
      {state.status === "loading" && <p className="ft-note">Fetching the tree from GitHub…</p>}
      {state.status === "error" && <p className="ft-note">{state.message} The repository is still one click away on GitHub.</p>}
      {state.status === "ready" && (
        <>
          <div className="ft-row ft-root">
            <FolderGlyph open />
            <span className="ft-name">{repo.name}</span>
            <span className="ft-count">{state.count} files</span>
          </div>
          <div className="ft-sub" data-open="true">
            <div className="ft-sub-inner">
              <Rows nodes={state.tree} open={open} toggle={toggle} selected={selected} onSelect={onSelect} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const BINARY = /\.(png|jpe?g|gif|webp|ico|svg|mp4|mov|webm|gz|zip|pdf|woff2?|ttf|otf|exe|dll|bin)$/i;
const MAX_BYTES = 400_000;

type FileState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; lines: string[]; cut: boolean };

/** The file's text, read straight from raw.githubusercontent.com, with line numbers. */
function CodeView({ repo, path }: { repo: Repo; path: string | null }) {
  const [file, setFile] = useState<FileState>({ status: "idle" });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!path) {
      setFile({ status: "idle" });
      return;
    }
    if (BINARY.test(path)) {
      setFile({ status: "error", message: "This file is not text. Open it on GitHub to see it." });
      return;
    }
    let alive = true;
    setFile({ status: "loading" });
    const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${path.split("/").map(encodeURIComponent).join("/")}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`GitHub answered ${res.status}.`);
        const text = await res.text();
        const cut = text.length > MAX_BYTES;
        return { lines: (cut ? text.slice(0, MAX_BYTES) : text).replace(/\r\n/g, "\n").split("\n"), cut };
      })
      .then((r) => {
        if (!alive) return;
        setFile({ status: "ready", ...r });
        box.current?.scrollTo({ top: 0 });
      })
      .catch((e: unknown) => {
        if (alive) setFile({ status: "error", message: e instanceof Error ? e.message : "Could not load the file." });
      });
    return () => {
      alive = false;
    };
  }, [repo.owner, repo.name, repo.branch, path]);

  const gh = path ? `https://github.com/${repo.owner}/${repo.name}/blob/${repo.branch}/${path}` : null;

  return (
    <section className="cv" aria-label={path ? `Contents of ${path}` : "File contents"}>
      <header className="cv-head">
        <span className="cv-path">{path ?? "Pick a file on the left"}</span>
        {gh && (
          <a className="link cv-gh" href={gh} target="_blank" rel="noreferrer">
            <span>View on GitHub</span> <Icon name="out" size={12} className="arrow" />
          </a>
        )}
      </header>
      <div ref={box} className="cv-body" data-lenis-prevent>
        {file.status === "idle" && <p className="ft-note">Open a folder, then choose a file to read it here.</p>}
        {file.status === "loading" && <p className="ft-note">Loading…</p>}
        {file.status === "error" && <p className="ft-note">{file.message}</p>}
        {file.status === "ready" && (
          <pre className="cv-code">
            <code>
              {file.lines.map((line, i) => (
                <span key={i} className="cv-line">
                  <span className="cv-ln" aria-hidden="true">
                    {i + 1}
                  </span>
                  {line || " "}
                </span>
              ))}
            </code>
            {file.cut && <span className="cv-cut">The file is long; the rest is on GitHub.</span>}
          </pre>
        )}
      </div>
    </section>
  );
}

/** The popup the "Code" button opens: the live tree, with GitHub one click away. */
export function RepoModal({ title, repo, onClose }: { title: string; repo: Repo; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const url = useMemo(() => `https://github.com/${repo.owner}/${repo.name}/tree/${repo.branch}`, [repo]);

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
    <div className="cert-modal" role="dialog" aria-modal="true" aria-label={`${title}, source code`} onClick={onClose}>
      <div className="cert-sheet repo-sheet" onClick={(e) => e.stopPropagation()}>
        <button ref={closeBtn} type="button" className="cert-close" onClick={onClose} aria-label="Close source code">
          <Icon name="close" size={18} />
        </button>
        <header className="repo-head">
          <div>
            <p className="eyebrow">Source code</p>
            <h3 className="repo-title">{title}</h3>
            <p className="repo-meta">
              {repo.owner}/{repo.name} <span className="repo-branch">{repo.branch}</span>
            </p>
          </div>
          <a className="btn btn-small btn-accent" href={url} target="_blank" rel="noreferrer">
            <Icon name="code" size={14} /> Open on GitHub <Icon name="out" size={14} />
          </a>
        </header>
        <div className="repo-body">
          <FileTree repo={repo} selected={selected} onSelect={setSelected} />
          <CodeView repo={repo} path={selected} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
