"use client";

import { Suspense, useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  /** Accessible name for the toggle (the <summary>). */
  label: string;
  /** Visible content of the toggle. */
  toggle: ReactNode;
  toggleClassName: string;
  className?: string;
  /** The menu panel. Links and buttons inside it close the menu when used. */
  children: ReactNode;
};

/**
 * A header dropdown built on <details>/<summary>, so it opens and closes with
 * the keyboard (Enter/Space) and works before hydration. On top of that it
 * closes when you click or tap outside it, press Escape, move focus out of it,
 * use one of its links or buttons, or when the route changes.
 */
export function DisclosureMenu({ label, toggle, toggleClassName, className, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);

  function close() {
    if (ref.current) ref.current.open = false;
  }

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const shut = () => {
      details.open = false;
    };

    function onPointerDown(event: PointerEvent) {
      if (details!.open && !details!.contains(event.target as Node)) shut();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !details!.open) return;
      shut();
      details!.querySelector("summary")?.focus();
    }

    // Tabbing (or otherwise moving focus) past the last item closes the menu.
    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget as Node | null;
      if (details!.open && next && !details!.contains(next)) shut();
    }

    // Using an item closes the menu. Deferred so the link's navigation or the
    // button's form submission runs first.
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      if (!target || target.closest("summary")) return;
      if (target.closest("a, button")) setTimeout(shut, 0);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    details.addEventListener("focusout", onFocusOut);
    details.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      details.removeEventListener("focusout", onFocusOut);
      details.removeEventListener("click", onClick);
      shut();
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      <summary
        aria-label={label}
        className={`${toggleClassName} list-none [&::-webkit-details-marker]:hidden`}
      >
        {toggle}
      </summary>
      {children}
      {/* Reading the URL suspends while prerendering, so it sits in its own
          boundary: the menu itself still renders in the static shell. */}
      <Suspense fallback={null}>
        <CloseOnRouteChange onChange={close} />
      </Suspense>
    </details>
  );
}

/** Calls `onChange` whenever the pathname or query string changes. */
function CloseOnRouteChange({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const onRouteChange = useEffectEvent(onChange);

  useEffect(() => {
    onRouteChange();
  }, [pathname, search]);

  return null;
}
