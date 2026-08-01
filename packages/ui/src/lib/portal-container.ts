"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  type RefObject,
  useContext,
} from "react";

type PortalMount =
  | HTMLElement
  | ShadowRoot
  | RefObject<HTMLElement | ShadowRoot | null>
  | null;

/**
 * Optional portal mount for preview sandboxes (e.g. Components tab).
 * When set, Base UI portals (dialog/menu/select) render inside the themed
 * tree instead of document.body — so brand tokens never need to leak onto
 * `<html>` to style overlays.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

export function PortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: ReactNode;
}) {
  return createElement(
    PortalContainerContext.Provider,
    { value: container },
    children
  );
}

export function usePortalContainer(
  override?: PortalMount
): PortalMount | undefined {
  const ctx = useContext(PortalContainerContext);
  if (override !== undefined) {
    return override ?? undefined;
  }
  return ctx ?? undefined;
}
