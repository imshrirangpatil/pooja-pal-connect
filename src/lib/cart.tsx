import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { samagri, type Samagri } from "./data";

export type CartItem = { item: Samagri; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  add: (id: string) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, number>>({});

  const value = useMemo<CartCtx>(() => {
    const items: CartItem[] = Object.entries(map)
      .map(([id, qty]) => {
        const item = samagri.find((s) => s.id === id);
        return item ? { item, qty } : null;
      })
      .filter((x): x is CartItem => !!x);
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.item.price, 0);
    const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 49;
    return {
      items,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      add: (id) => setMap((m) => ({ ...m, [id]: (m[id] ?? 0) + 1 })),
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
          else next[id] = qty;
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
