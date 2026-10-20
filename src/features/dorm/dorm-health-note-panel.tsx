"use client";

import {
  HealthNoteForm,
  type PickerWords,
} from "@/health-notes/health-note-form";
import styles from "./dorm-health.module.css";
import {
  dormHealthSubjectAction,
  saveDormHealthNoteAction,
  searchDormHealthStudentsAction,
} from "./dorm-health-actions";
import type { DormHealthSubject } from "./dorm-health-subject";
import { MarkFields } from "./mental-health-mark-fields";
import type { MentalHealthMark } from "./mental-health-mark-ids";

/** What "Mahasiswa" says on Asrama > Kesehatan, which offers residents only. */
export const ASRAMA_PICKER: PickerWords = {
  placeholder: "Ketik nama atau NIM penghuni asrama",
  nobodyFound: "Tidak ada penghuni asrama aktif yang cocok.",
};

/**
 * A new key for each mark the server gives, so the fields start again
 * from a mark saved, and keep what is typed while it stays the same.
 */
function markKey(mark: MentalHealthMark | null): string {
  if (mark === null) return "none";
  return `${mark.category}:${mark.observation}`;
}

function markFieldsOf(subject: DormHealthSubject) {
  return <MarkFields key={markKey(subject.mark)} mark={subject.mark} />;
}

/**
 * The form of "Catatan kesehatan" for the writers, with the line on whom
 * it is for, as in the prototype, and "Potensi kesehatan mental" for an
 * account that may set the mark.
 */
export function DormHealthNoteForm({
  today,
  newKey,
  marks,
}: {
  today: string;
  newKey: string;
  /** Whether the account sets marks "Potensi kesehatan mental". */
  marks: boolean;
}) {
  return (
    <>
      <p className={styles.sub}>
        Untuk penghuni asrama. Catatan kesehatan mahasiswa non asrama diisi di
        menu Penilaian &gt; Penilaian jasmani. Riwayat penyakit dan catatannya
        menjadi pertimbangan kategori: kategori akhir adalah yang lebih berat
        antara hasil tes kebugaran dan catatan kesehatan.
      </p>
      <HealthNoteForm
        today={today}
        newKey={newKey}
        actions={{
          search: searchDormHealthStudentsAction,
          subject: dormHealthSubjectAction,
          save: saveDormHealthNoteAction,
        }}
        words={ASRAMA_PICKER}
        {...(marks ? { more: markFieldsOf } : {})}
      />
    </>
  );
}
