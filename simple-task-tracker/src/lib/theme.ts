"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-key";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* storage may be blocked */ }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** The workspace theme, kept on <html data-theme> so dialogs and toasts follow it. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
