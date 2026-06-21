import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { samagri, type Samagri } from "./data";

export type CartItem = { item: Samagri; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  add: (idOrItem: string | Samagri) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "pranam.cart.v2";

type StoredEntry = { item: Samagri; qty: number };

function loadInitial(): Record<string, StoredEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, StoredEntry>>({});

  useEffect(() => {
    setMap(loadInitial());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore quota errors */
    }
  }, [map]);

  const value = useMemo<CartCtx>(() => {
    const items: CartItem[] = Object.values(map).map((e) => ({ item: e.item, qty: e.qty }));
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.item.price, 0);
    const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 49;
    return {
      items,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      add: (idOrItem) =>
        setMap((m) => {
          let item: Samagri | undefined;
          let id: string;
          if (typeof idOrItem === "string") {
            id = idOrItem;
            item = m[id]?.item ?? samagri.find((s) => s.id === id);
          } else {
            id = idOrItem.id;
            item = idOrItem;
          }
          if (!item) return m;
          const prev = m[id];
          return { ...m, [id]: { item, qty: (prev?.qty ?? 0) + 1 } };
        }),
      remove: (id) =>
        setMap((m) => {
          const next = { ...m };
          delete next[id];
          return next;
        }),
      setQty: (id, qty) =>
        setMap((m) => {
          const next = { ...m };
          if (qty <= 0) delete next[id];
          else if (next[id]) next[id] = { ...next[id], qty };
          return next;
        }),
      clear: () => setMap({}),
    };
  }, [map]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
