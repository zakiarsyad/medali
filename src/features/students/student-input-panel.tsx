"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { ModeSwitch } from "@/ui/mode-switch";
import styles from "./new-students.module.css";
import { FORM_ANCHOR } from "./new-students-address";
import { StudentForm, type StudentFormProps } from "./student-form";
import { StudentUpload } from "./student-upload";

const MODES = [
  ["form", "Formulir"],
  ["upload", "Unggah berkas"],
] as const;

type Mode = (typeof MODES)[number][0];

/**
 * The panel that puts students in: one by one through the form, or many
 * at once from a file. A student is changed through the form only.
 */
export function StudentInputPanel(props: StudentFormProps) {
  const [mode, setMode] = useState<Mode>("form");
  const { editing } = props;
  return (
    <section className={shared.panel} id={FORM_ANCHOR}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            {editing ? "Ubah data mahasiswa" : "Input data mahasiswa"}
          </h2>
          <p className={shared.detail}>
            {editing
              ? `NIM ${editing.nim}`
              : "Satu per satu lewat formulir, atau banyak sekaligus lewat unggah berkas."}
          </p>
        </div>
        {!editing && (
          <ModeSwitch
            legend="Cara input"
            modes={MODES}
            mode={mode}
            onChoose={setMode}
          />
        )}
      </div>
      {mode === "upload" && !editing ? (
        <StudentUpload cohortYears={props.cohortYears} />
      ) : (
        <StudentForm {...props} />
      )}
    </section>
  );
}
