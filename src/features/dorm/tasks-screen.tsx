import { PageHead } from "@/ui/page-head";
import styles from "./tasks.module.css";

function AllClear() {
  return (
    <p className={styles.box}>
      <b>Semua tugas sudah beres.</b> Tidak ada yang menunggu tindakan Anda saat
      ini.
    </p>
  );
}

/**
 * Tugas saya of Pengelola Asrama: the title, what the page is for, and
 * "Semua tugas sudah beres." while nothing waits for them.
 */
export function DormTasksScreen({ waiting }: { waiting: number }) {
  return (
    <>
      <PageHead title="Tugas saya">
        Semua hal yang menunggu tindakan Pengelola Asrama dalam satu halaman:
        persetujuan izin dan validasi laporan kembali. Selesaikan langsung di
        sini tanpa berpindah menu.
      </PageHead>
      {waiting === 0 && <AllClear />}
    </>
  );
}
