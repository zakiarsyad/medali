import styles from "./data-screen.module.css";
import { Notice } from "./notice";

/** "Halaman tidak ditemukan" for someone who has no menu to pick from. */
export function AddressNotFound() {
  return (
    <Notice title="Halaman tidak ditemukan">
      Alamat ini tidak ada.{" "}
      <a href="/" className={styles.link}>
        Kembali ke halaman utama.
      </a>
    </Notice>
  );
}
