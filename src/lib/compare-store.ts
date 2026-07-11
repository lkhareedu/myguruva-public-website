"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "myguruva.compare.v1";
const EVT = "myguruva:compare-change";
export const COMPARE_MAX = 4;

export type CompareItem = {
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
};

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  return getSnapshot();
}

const EMPTY: CompareItem[] = [];
let cachedRaw: string | null | undefined;
let cachedSnapshot: CompareItem[] = EMPTY;

function parseSnapshot(raw: string | null): CompareItem[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const items = parsed.slice(0, COMPARE_MAX).filter((v): v is CompareItem =>
      !!v && typeof v.slug === "string" && typeof v.name === "string",
    );
    return items.length > 0 ? items : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CompareItem[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = parseSnapshot(raw);
  return cachedSnapshot;
}

function getServerSnapshot(): CompareItem[] {
  return EMPTY;
}

function write(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  const next = items.slice(0, COMPARE_MAX);
  const raw = JSON.stringify(next);
  cachedRaw = raw;
  cachedSnapshot = next.length > 0 ? next : EMPTY;
  window.localStorage.setItem(KEY, raw);
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onEvt = () => cb();
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVT, onEvt);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onEvt);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCompare() {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Hydration guard: only reveal real count after mount to avoid SSR mismatch.
  const hydrated = useHydrated();
  const safeItems = hydrated ? items : EMPTY;

  return {
    items: safeItems,
    count: safeItems.length,
    isFull: safeItems.length >= COMPARE_MAX,
    has: (slug: string) => safeItems.some((i) => i.slug === slug),
    add: (item: CompareItem) => {
      const cur = read();
      if (cur.some((i) => i.slug === item.slug)) return { ok: false, reason: "duplicate" as const };
      if (cur.length >= COMPARE_MAX) return { ok: false, reason: "full" as const };
      write([...cur, item]);
      return { ok: true as const };
    },
    remove: (slug: string) => {
      write(read().filter((i) => i.slug !== slug));
    },
    toggle: (item: CompareItem) => {
      const cur = read();
      if (cur.some((i) => i.slug === item.slug)) {
        write(cur.filter((i) => i.slug !== item.slug));
        return { added: false as const };
      }
      if (cur.length >= COMPARE_MAX) return { added: false as const, full: true as const };
      write([...cur, item]);
      return { added: true as const };
    },
    clear: () => write([]),
    hydrated,
  };
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}

// One-shot hydration from URL param (?slugs=a,b,c) — legacy links.
export function useHydrateCompareFromCsv(csv: string | undefined | null, resolver: (slug: string) => CompareItem | null) {
  useEffect(() => {
    if (!csv) return;
    const slugs = csv.split(",").map((s) => s.trim()).filter(Boolean).slice(0, COMPARE_MAX);
    if (slugs.length === 0) return;
    const cur = read();
    const merged: CompareItem[] = [...cur];
    for (const s of slugs) {
      if (merged.some((i) => i.slug === s)) continue;
      if (merged.length >= COMPARE_MAX) break;
      const it = resolver(s);
      if (it) merged.push(it);
    }
    if (merged.length !== cur.length) write(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csv]);
}
