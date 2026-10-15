"use client";

import { type ReactNode, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { NOTHING_WAITS } from "./tasks-card";

/**
 * The items of one section of Tugas saya, drawn by `children`, or "Tidak
 * ada yang menunggu.". An item leaves the list once it is settled,
 * decided here or elsewhere, as the server reads the list again; what
 * was said of it stays above the list, also once the list is empty.
 * `children` gives each item the way to hand that up.
 */
export function TaskItems({
  isEmpty,
  children,
}: {
  isEmpty: boolean;
  children: (onSettled: (said: FormState) => void) => ReactNode;
}) {
  const [said, setSaid] = useState<FormState | null>(null);
  return (
    <>
      {said && <FormMessage state={said} />}
      {isEmpty ? (
        <p className={shared.empty}>{NOTHING_WAITS}</p>
      ) : (
        children(setSaid)
      )}
    </>
  );
}

/** The items of one section of Tugas saya as cards, one column on a phone. */
export function TaskCards<Item>({
  items,
  keyOf,
  cardOf,
}: {
  items: Item[];
  keyOf: (item: Item) => string;
  cardOf: (item: Item, onSettled: (said: FormState) => void) => ReactNode;
}) {
  return (
    <TaskItems isEmpty={items.length === 0}>
      {(onSettled) => (
        <ul className={styles.cards}>
          {items.map((item) => (
            <li key={keyOf(item)} className={styles.card}>
              {cardOf(item, onSettled)}
            </li>
          ))}
        </ul>
      )}
    </TaskItems>
  );
}
