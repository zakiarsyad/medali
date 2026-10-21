"use client";

import { type ReactNode, useId, useState } from "react";
import shared from "./data-screen.module.css";
import styles from "./filter-fold.module.css";
import { filterFoldStartsOpen } from "./filter-fold-start";
import { filterFoldWords } from "./filter-fold-words";

/**
 * The filters of the top bar. On a phone they are folded away under one
 * button, which says how many are in use; at computer width the button is
 * not shown and the filters always are. Folded filters stay in the form,
 * so what they hold is still sent.
 */
export function FilterFold({
  inUse,
  children,
}: {
  /** How many of the filters are in use. */
  inUse: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(filterFoldStartsOpen(inUse));
  const filtersId = useId();
  return (
    <>
      <button
        type="button"
        className={`${shared.quiet} ${styles.foldButton}`}
        aria-expanded={open}
        aria-controls={filtersId}
        onClick={() => setOpen(!open)}
      >
        {filterFoldWords(inUse)}
      </button>
      <div id={filtersId} className={open ? undefined : styles.folded}>
        <div className={shared.form}>{children}</div>
      </div>
    </>
  );
}
