"use client";

import { type ReactNode, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { NOTHING_WAITS } from "./tasks-card";

/**
 * The cards of one section of Tugas saya, or "Tidak ada yang menunggu.".
 * An item leaves the list once it is settled, decided here or elsewhere,
 * as the server reads the list again; what was said of it stays above
 * the list, also once the list is empty. `cardOf` gives each card the
 * way to hand that up.
 */
export function TaskCards<Item>({
  items,
  keyOf,
  cardOf,
}: {
  items: Item[];
  keyOf: (item: Item) => string;
  cardOf: (item: Item, onSettled: (said: FormState) => void) => ReactNode;
}) {
  const [said, setSaid] = useState<FormState | null>(null);
  return (
    <>
      {said && <FormMessage state={said} />}
      {items.length === 0 ? (
        <p className={shared.empty}>{NOTHING_WAITS}</p>
      ) : (
        <ul className={styles.cards}>
          {items.map((item) => (
            <li key={keyOf(item)} className={styles.card}>
              {cardOf(item, setSaid)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
