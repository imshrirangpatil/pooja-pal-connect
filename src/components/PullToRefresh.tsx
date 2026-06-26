import { useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Lightweight pull-to-refresh for feeds. It only engages when the page is scrolled
// to the very top and the user drags down, and it never blocks normal scrolling
// (no preventDefault), so it can't jank the page. The pull distance is damped.
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void> | void; children: ReactNode }) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESHOLD = 64;

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = !refreshing && window.scrollY <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 80));
  };
  const onTouchEnd = async () => {
    const trigger = startY.current !== null && pull >= THRESHOLD * 0.5;
    startY.current = null;
    if (!trigger) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(36);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        style={{ height: pull, transition: startY.current === null ? "height 0.2s ease" : "none" }}
        className="flex items-end justify-center overflow-hidden"
      >
        {(pull > 6 || refreshing) && <Loader2 className={`mb-2 h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`} />}
      </div>
      {children}
    </div>
  );
}
