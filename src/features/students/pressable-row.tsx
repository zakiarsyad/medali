"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/** Whether the press was on a link, which then opens by itself. */
function onLink(event: MouseEvent<HTMLTableRowElement>): boolean {
  if (!(event.target instanceof Element)) return false;
  return event.target.closest("a") !== null;
}

/** Whether the press ended a drag that marked text, to copy a NIM for one. */
function markedText(): boolean {
  const marked = window.getSelection();
  return marked !== null && marked.toString() !== "";
}

/**
 * A row of a list that opens an address when it is pressed anywhere. The
 * row must also hold a link to the same address: that link is what the
 * keyboard and a screen reader use.
 */
export function PressableRow({
  address,
  className,
  children,
}: {
  address: string;
  className: string | undefined;
  children: ReactNode;
}) {
  const router = useRouter();

  function open(event: MouseEvent<HTMLTableRowElement>) {
    if (onLink(event)) return;
    if (markedText()) return;
    router.push(address, { scroll: false });
  }

  return (
    <tr className={className} onClick={open}>
      {children}
    </tr>
  );
}
