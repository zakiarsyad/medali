"use client";

import { type ReactNode, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { NOTHING_WAITS } from "./tasks-card";

/**
 * The cards of one section of Tugas saya, or "Tidak ada yang menunggu.".
 * A kept decision takes its item off the list, which the server reads
 * again, so its answer stays above the list, also once the list is
 * empty. `cardOf` gives each card the way to hand that answer up.
 */
export function TaskCards<Item>({
  items,
  keyOf,
  cardOf,
}: {
  items: Item[];
  keyOf: (item: Item) => string;
  cardOf: (item: Item, onKept: (answer: FormState) => void) => ReactNode;
}) {
  const [kept, setKept] = useState<FormState | null>(null);
  return (
    <>
      {kept && <FormMessage state={kept} />}
      {items.length === 0 ? (
        <p className={shared.empty}>{NOTHING_WAITS}</p>
      ) : (
        <ul className={styles.cards}>
          {items.map((item) => (
            <li key={keyOf(item)} className={styles.card}>
              {cardOf(item, setKept)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
