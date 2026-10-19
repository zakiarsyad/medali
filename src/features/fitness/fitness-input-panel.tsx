"use client";

import { type ReactNode, useState } from "react";
import { ModeSwitch } from "@/ui/mode-switch";
import { FitnessUpload } from "./fitness-upload";

const MODES = [
  ["form", "Formulir kolektif"],
  ["upload", "Unggah berkas"],
] as const;

type Mode = (typeof MODES)[number][0];

/**
 * "Input hasil tes kebugaran" for those who may enter scores: the group
 * form, or many students at once from a file.
 */
export function FitnessInputPanel({
  today,
  form,
}: {
  /** Today on campus, where "Tanggal tes" of a file starts. */
  today: string;
  form: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("form");
  return (
    <>
      <ModeSwitch modes={MODES} mode={mode} onChoose={setMode} />
      {mode === "upload" ? <FitnessUpload today={today} /> : form}
    </>
  );
}
