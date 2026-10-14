import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./siku.module.css";

/**
 * "Ajukan penambahan SIKU" beside "Pengajuan saya" on a laptop, one
 * below the other on a phone.
 */
export function OwnRequestPanels({
  form,
  list,
}: {
  form: ReactNode;
  list: ReactNode;
}) {
  return (
    <div className={styles.sideBySide}>
      <section className={shared.panel}>
        <h2 className={shared.heading}>Ajukan penambahan SIKU</h2>
        <p className={styles.sub}>
          Laporkan kegiatan yang memenuhi kriteria penambahan SIKU. Penilai
          Mahasiswa memeriksa laporan Anda dan menentukan poinnya.
        </p>
        {form}
      </section>
      {list}
    </div>
  );
}
