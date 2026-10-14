"use client";

import { type ChangeEvent, type DragEvent, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "@/ui/file-upload.module.css";

/** The place to pick a CSV file, or to drop one on. */
export function FileDrop({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  const [over, setOver] = useState(false);

  function picked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Emptied so that picking the same file again is noticed.
    event.target.value = "";
    if (file) onPick(file);
  }

  function draggedOver(event: DragEvent<HTMLLabelElement>) {
    // Without this the browser opens the dropped file instead.
    event.preventDefault();
    setOver(true);
  }

  function dropped(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setOver(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onPick(file);
  }

  return (
    <label
      className={over ? `${styles.drop} ${styles.dropOver}` : styles.drop}
      onDragOver={draggedOver}
      onDragLeave={() => setOver(false)}
      onDrop={dropped}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        className={shared.hidden}
        disabled={disabled}
        onChange={picked}
      />
      <b>Pilih berkas CSV</b>
      <span>atau seret berkas ke sini</span>
    </label>
  );
}
