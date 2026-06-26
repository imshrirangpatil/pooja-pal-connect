import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import logoAsset from "@/assets/pranam-logo.png.asset.json";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md overscroll-y-contain bg-background pb-[calc(env(safe-area-inset-bottom)+6rem)] [scroll-behavior:smooth]">
      {children}
      <BottomNav />
    </div>
  );
}

export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/50 bg-background/85 px-5 pb-3 pt-5 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={logoAsset.url} alt="Pranam" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
