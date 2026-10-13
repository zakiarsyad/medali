import shared from "@/ui/data-screen.module.css";
import { USUAL_SIZE_WORDS } from "@/ui/group-size";

/** "Alur penetapan": the four steps from new students to fixed groups. */
export function FlowPanel() {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Alur penetapan</h2>
      <ol className={shared.flow}>
        <li>
          <b>Data mahasiswa baru masuk</b>
          <span>
            Mahasiswa angkatan baru belum punya kelompok pengasuhan dan tampil
            "Belum ditetapkan" sampai penetapan dilakukan.
          </span>
        </li>
        <li>
          <b>Bentuk kelompok</b>
          <span>
            Pegawai UPK atau Kepala Unit memilih ukuran ({USUAL_SIZE_WORDS}) dan
            metode pembagian, lalu dapat memindahkan anggota antarkelompok.
          </span>
        </li>
        <li>
          <b>Pilih pengasuh</b>
          <span>
            Satu pengasuh untuk satu kelompok, diutamakan dari jurusan yang
            sama. Bisa diisi otomatis lalu disesuaikan.
          </span>
        </li>
        <li>
          <b>Tetapkan</b>
          <span>
            Pegawai UPK mengajukan, Kepala Unit menetapkan dengan nomor surat.
            Kelompok berlaku sampai lulus; perubahan selanjutnya lewat
            penggantian pengasuh.
          </span>
        </li>
      </ol>
    </section>
  );
}
