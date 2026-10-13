import shared from "@/ui/data-screen.module.css";
import { FAIR_FROM } from "./evaluation-result";

/** "Alur penggantian": the four steps from an evaluation to a kept history. */
export function ReplacementFlow() {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Alur penggantian</h2>
      <ol className={shared.flow}>
        <li>
          <b>Evaluasi</b>
          <span>
            Kepala UPK menilai pengasuh setiap periode. Hasil kurang (di bawah{" "}
            {FAIR_FROM}) menjadi dasar penggantian.
          </span>
        </li>
        <li>
          <b>Tetapkan pengganti</b>
          <span>
            Pilih pengasuh cadangan, alasan, tanggal efektif, dan nomor surat.
            Untuk mutasi atau pensiun, evaluasi tidak diperlukan.
          </span>
        </li>
        <li>
          <b>Berlaku untuk satu kelompok</b>
          <span>
            Seluruh anggota kelompok pengasuhan beralih ke pengasuh baru pada
            tanggal efektif. Kelompok tidak dipecah.
          </span>
        </li>
        <li>
          <b>Riwayat tetap tersimpan</b>
          <span>
            Catatan pengasuhan lama tetap atas nama pengasuh sebelumnya.
            Pengasuh lama menjadi cadangan atau tidak aktif.
          </span>
        </li>
      </ol>
    </section>
  );
}
