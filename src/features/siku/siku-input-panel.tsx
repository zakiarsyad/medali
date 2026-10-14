"use client";

import { type ReactNode, useState } from "react";
import { ModeSwitch } from "@/ui/mode-switch";
import styles from "./siku.module.css";
import { SikuInputTitle } from "./siku-input-title";
import { SikuUpload } from "./siku-upload";

const MODES = [
  ["form", "Formulir kolektif"],
  ["upload", "Unggah berkas"],
] as const;

type Mode = (typeof MODES)[number][0];

/**
 * "Input nilai SIKU" for those who may enter it: the form, or many gains
 * and losses at once from a file.
 */
export function SikuInputPanel({
  base,
  form,
}: {
  base: number;
  form: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("form");
  return (
    <>
      <div className={styles.panelHead}>
        <SikuInputTitle base={base} />
        <ModeSwitch modes={MODES} mode={mode} onChoose={setMode} />
      </div>
      {mode === "upload" ? <SikuUpload /> : form}
    </>
  );
}
