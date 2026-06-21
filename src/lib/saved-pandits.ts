import { useEffect, useState, useCallback } from "react";

const KEY = "pranam:saved-pandits";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

function write(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* noop */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pranam:saved-pandits-changed"));
  }
}

export function useSavedPandits() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener("pranam:saved-pandits-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pranam:saved-pandits-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(next);
    setIds(next);
    return next.includes(id);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((x) => x !== id);
    write(next);
    setIds(next);
  }, []);

  return { ids, isSaved, toggle, remove };
}
