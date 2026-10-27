"use client";

import type { MouseEvent, ReactNode } from "react";
import { usePageMove } from "./page-move";
import styles from "./pressable-row.module.css";
import { rememberPressedBox } from "./pressed-box";

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
 * keyboard and a screen reader use. The address opens a box over the
 * screen unless the row says it opens a page. A box is remembered as
 * opened by a press, either way it was pressed, so it can close by going
 * back; a page is opened from its top.
 */
export function PressableRow({
  address,
  opens = "box",
  children,
}: {
  address: string;
  opens?: "box" | "page";
  children: ReactNode;
}) {
  const router = usePageMove();
  const opensBox = opens === "box";

  function open(event: MouseEvent<HTMLTableRowElement>) {
    if (onLink(event)) {
      if (opensBox) rememberPressedBox(address);
      return;
    }
    if (markedText()) return;
    if (opensBox) rememberPressedBox(address);
    router.push(address, { scroll: !opensBox });
  }

  return (
    <tr className={styles.row} onClick={open}>
      {children}
    </tr>
  );
}
