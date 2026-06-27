import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { canGoBack } from "@/lib/nav-stack";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Where to go if there is no in-app history (e.g. user landed directly). */
  fallback?: string;
  /** Optional override classes for the button shell. */
  className?: string;
  /** Override icon size class (default `h-4 w-4`). */
  iconClassName?: string;
  /** Aria label, defaults to "Go back". */
  label?: string;
}

/**
 * Back button that respects the user's navigation stack:
 * - If they navigated to this page from inside the app, it pops to the actual
 *   previous page via the browser history.
 * - Otherwise it falls back to the provided route (or `/`).
 */
export function BackButton({
  fallback = "/",
  className,
  iconClassName,
  label = "Go back",
}: BackButtonProps) {
  const router = useRouter();
  const navigate = useNavigate();

  const onClick = () => {
    // Only pop the browser history when we tracked an in-app step to return to
    // AND the browser actually has an entry to go back to. Otherwise (deep link,
    // hard refresh, opened in a new tab) go to a sensible parent so back never
    // dead-ends or leaves the app.
    const hasBrowserHistory = typeof window !== "undefined" && window.history.length > 1;
    if (canGoBack() && hasBrowserHistory) {
      router.history.back();
    } else {
      navigate({ to: fallback });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition hover:bg-secondary/80 active:scale-95",
        className,
      )}
    >
      <ArrowLeft className={cn("h-4 w-4", iconClassName)} />
    </button>
  );
}
