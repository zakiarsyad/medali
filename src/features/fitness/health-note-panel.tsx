import shared from "@/ui/data-screen.module.css";
import styles from "./fitness.module.css";
import { HealthNoteForm } from "./health-note-form";

/**
 * "Catatan kesehatan", with its form. Shown only to the roles that write
 * notes: any other role learns nothing from it, not even that it exists.
 */
export function HealthNotePanel({
  today,
  newKey,
}: {
  today: string;
  newKey: string;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Catatan kesehatan</h2>
      <p className={styles.sub}>
        Untuk mahasiswa <b>non asrama</b>. Catatan kesehatan penghuni asrama
        diisi di menu Asrama &gt; Kesehatan. Riwayat penyakit dan catatannya
        menjadi pertimbangan kategori: kategori akhir adalah yang lebih berat
        antara hasil tes kebugaran dan catatan kesehatan.
      </p>
      <HealthNoteForm today={today} newKey={newKey} />
    </section>
  );
}
