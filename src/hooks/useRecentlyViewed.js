import { useEffect, useState } from "react";

const KEY = "jsd_recently_viewed";
const MAX = 8;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

// Call from ProductDetail on mount to record a real view — no fabricated
// data, this only ever reflects products the visitor actually opened.
export function trackProductView(id) {
  if (!id) return;
  const cur = load().filter((existingId) => existingId !== id);
  const next = [id, ...cur].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
}

// Call from Home (or anywhere) to read the list, most-recent first.
export default function useRecentlyViewed() {
  const [ids, setIds] = useState(load);
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setIds(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return ids;
}
