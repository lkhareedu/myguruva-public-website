"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchSuggest } from "@/lib/client-api";

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 180);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: () => fetchSuggest(debounced),
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const colleges = data?.colleges ?? [];
  const streams = data?.streams ?? [];
  const cities = data?.cities ?? [];
  const flat: Array<{ kind: "college" | "stream" | "city"; label: string; sub?: string; onSelect: () => void }> = [
    ...colleges.map((c) => ({
      kind: "college" as const,
      label: c.name,
      sub: [c.city, c.state].filter(Boolean).join(", "),
      onSelect: () => router.push(`/colleges/${c.slug}`),
    })),
    ...streams.map((s) => ({
      kind: "stream" as const,
      label: s.name,
      sub: "Stream",
      onSelect: () => router.push(`/colleges?stream=${encodeURIComponent(s.name)}`),
    })),
    ...cities.map((c) => ({
      kind: "city" as const,
      label: c,
      sub: "City",
      onSelect: () => router.push(`/colleges?city=${encodeURIComponent(c)}`),
    })),
  ];

  function submit() {
    setOpen(false);
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIdx >= 0 && flat[activeIdx]) {
        flat[activeIdx].onSelect();
        setOpen(false);
      } else {
        submit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && debounced.length >= 2;

  return (
    <div ref={containerRef} className={"relative " + (compact ? "w-full max-w-sm" : "w-full max-w-xl")}>
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm focus-within:border-primary/60">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={compact ? "Search…" : "Search colleges, streams, cities…"}
          className="flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search"
          autoComplete="off"
        />
        {value ? (
          <button
            onClick={() => { setValue(""); setDebounced(""); setOpen(false); }}
            className="text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            ✕
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {isFetching && !data ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-8 animate-pulse rounded-md bg-primary/10" />
              ))}
            </div>
          ) : flat.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No matches. Press Enter to search anyway.
            </div>
          ) : (
            <>
              {colleges.length > 0 && (
                <Section title="Colleges">
                  {colleges.map((c, idx) => (
                    <Row
                      key={c.slug}
                      active={activeIdx === idx}
                      onClick={() => { router.push(`/colleges/${c.slug}`); setOpen(false); }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      icon={
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                          {c.name.slice(0, 1)}
                        </span>
                      }
                      label={c.name}
                      sub={[c.city, c.state].filter(Boolean).join(", ")}
                      badge={c.verified ? "Verified" : undefined}
                    />
                  ))}
                </Section>
              )}
              {streams.length > 0 && (
                <Section title="Streams">
                  {streams.map((s, idx) => {
                    const i = colleges.length + idx;
                    return (
                      <Row
                        key={s.slug}
                        active={activeIdx === i}
                        onClick={() => { router.push(`/colleges?stream=${encodeURIComponent(s.name)}`); setOpen(false); }}
                        onMouseEnter={() => setActiveIdx(i)}
                        icon={<span className="text-muted-foreground">📚</span>}
                        label={s.name}
                        sub="Browse colleges in this stream"
                      />
                    );
                  })}
                </Section>
              )}
              {cities.length > 0 && (
                <Section title="Cities">
                  {cities.map((c, idx) => {
                    const i = colleges.length + streams.length + idx;
                    return (
                      <Row
                        key={c}
                        active={activeIdx === i}
                        onClick={() => { router.push(`/colleges?city=${encodeURIComponent(c)}`); setOpen(false); }}
                        onMouseEnter={() => setActiveIdx(i)}
                        icon={<span className="text-muted-foreground">📍</span>}
                        label={c}
                        sub="City filter"
                      />
                    );
                  })}
                </Section>
              )}
              <button
                onClick={submit}
                className="block w-full border-t border-border/60 px-4 py-2.5 text-left text-xs font-medium text-primary hover:bg-muted"
              >
                See all results for &quot;{value.trim()}&quot; →
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-border/50 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function Row({
  active, onClick, onMouseEnter, icon, label, sub, badge,
}: {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  badge?: string;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={
          "flex w-full items-center gap-3 px-3 py-2 text-left text-sm " +
          (active ? "bg-muted" : "hover:bg-muted/60")
        }
      >
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{label}</span>
          {sub ? <span className="block truncate text-xs text-muted-foreground">{sub}</span> : null}
        </span>
        {badge ? (
          <span className="rounded-full bg-[color:var(--verified)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--verified)]">
            {badge}
          </span>
        ) : null}
      </button>
    </li>
  );
}
