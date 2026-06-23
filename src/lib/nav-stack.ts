// In-memory back navigation stack. Tracks the user's path through the app
// so the back button can return to the actual previous page (not a hardcoded
// parent). Mirrors browser history so `router.history.back()` stays in sync.

const STORAGE_KEY = "pranam:nav-stack";
const MAX = 50;

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function save(stack: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    /* ignore quota */
  }
}

let stack: string[] = load();

export function recordNavigation(path: string) {
  const len = stack.length;
  if (len > 0 && stack[len - 1] === path) return;
  // Detect back navigation: new location equals previous-but-one entry → pop top.
  if (len > 1 && stack[len - 2] === path) {
    stack.pop();
  } else {
    stack.push(path);
    if (stack.length > MAX) stack = stack.slice(stack.length - MAX);
  }
  save(stack);
}

export function canGoBack(): boolean {
  return stack.length > 1;
}

export function getStack(): readonly string[] {
  return stack;
}

export function clearStack() {
  stack = [];
  save(stack);
}
