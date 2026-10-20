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

/** What "Mahasiswa" says on Asrama > Kesehatan, which offers residents only. */
export const ASRAMA_PICKER: PickerWords = {
  placeholder: "Ketik nama atau NIM penghuni asrama",
  nobodyFound: "Tidak ada penghuni asrama aktif yang cocok.",
};

/**
 * The form of "Catatan kesehatan" for the writers, with the line on whom
 * it is for, as in the prototype.
 */
export function DormHealthNoteForm({
  today,
  newKey,
}: {
  today: string;
  newKey: string;
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
      />
    </>
  );
}
