"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { ModeSwitch } from "@/ui/mode-switch";
import { AssessmentForm, type LevelTexts } from "./assessment-form";
import type { AssessmentPick } from "./assessment-picks";
import { AssessmentUpload } from "./assessment-upload";
import styles from "./character-assessment.module.css";

const MODES = [
  ["one", "Satu mahasiswa"],
  ["upload", "Unggah berkas"],
] as const;

type Mode = (typeof MODES)[number][0];

function InputHead({
  mode,
  onChoose,
}: {
  mode: Mode;
  onChoose: (mode: Mode) => void;
}) {
  return (
    <div className={styles.panelHead}>
      <h2 className={shared.heading}>Input capaian MEDALI</h2>
      <ModeSwitch modes={MODES} mode={mode} onChoose={onChoose} />
    </div>
  );
}

/**
 * "Input capaian MEDALI" for those who may enter it: one student through
 * the form beside the medal, or many at once from a file, across the
 * whole width so the preview of the file has room.
 */
export function AssessmentInputPanel({
  newAssessmentId,
  levelTexts,
  startPick = null,
}: {
  newAssessmentId: string;
  levelTexts: LevelTexts;
  /** The student the form opens with, picked, or null for nobody. */
  startPick?: AssessmentPick | null;
}) {
  const [mode, setMode] = useState<Mode>("one");
  const head = <InputHead mode={mode} onChoose={setMode} />;
  if (mode === "upload") {
    return (
      <section className={shared.panel}>
        {head}
        <AssessmentUpload />
      </section>
    );
  }
  return (
    <AssessmentForm
      newAssessmentId={newAssessmentId}
      levelTexts={levelTexts}
      head={head}
      startPick={startPick}
    />
  );
}
