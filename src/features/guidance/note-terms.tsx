import shared from "@/ui/data-screen.module.css";
import { PUNISHMENT_WORDS } from "./note-words";
import { NOTE_PUNISHMENTS } from "./violation-note-ids";
import styles from "./violation-notes.module.css";

/** "Ketentuan": the rules of the notes, as in the prototype, for the writers. */
export function NoteTerms({ semester }: { semester: string }) {
  const punishments = NOTE_PUNISHMENTS.map((each) => PUNISHMENT_WORDS[each]);
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Ketentuan</h2>
      <ul className={styles.terms}>
        <li>
          <b>Sebelum hukuman disiplin</b>
          <span>
            Catatan ini untuk pelanggaran yang belum dijatuhi hukuman disiplin
            ringan.
          </span>
        </li>
        <li>
          <b>Berlaku 1 semester</b>
          <span>
            Catatan semester {semester} berlaku sampai semester berakhir, lalu
            tidak dihitung lagi. Semester sebuah catatan mengikuti tanggalnya.
          </span>
        </li>
        <li>
          <b>Kategori</b>
          <span>
            Pelanggaran pertama, atau pelanggaran lanjutan bila mahasiswa sudah
            punya catatan aktif pada semester yang sama. Kategori ditentukan
            otomatis dari tanggal catatan.
          </span>
        </li>
        <li>
          <b>Jenis hukuman</b>
          <span>{punishments.join(", ")}.</span>
        </li>
        <li>
          <b>Bila berulang</b>
          <span>
            Mahasiswa dengan pelanggaran lanjutan dapat dipertimbangkan untuk
            dijatuhi hukuman disiplin ringan di tab Pelanggaran disiplin.
          </span>
        </li>
      </ul>
    </section>
  );
}
