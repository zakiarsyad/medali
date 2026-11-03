import { BareScreen } from "@/ui/bare-screen";
import shared from "@/ui/data-screen.module.css";
import heads from "@/ui/page-head.module.css";
import styles from "./privacy-screen.module.css";

export const PRIVACY_PATH = "/privasi";

const CONTACT = "asramaupk@gmail.com";

/** What sign-in takes from Google, for anyone, signed in or not. */
export function PrivacyScreen() {
  return (
    <BareScreen>
      <article className={styles.text}>
        <h1 className={heads.title}>Kebijakan privasi</h1>
        <p className={styles.campus}>MEDALI · PKN STAN</p>

        <h2 className={shared.heading}>Yang diterima dari Google</h2>
        <p>
          Saat Anda masuk dengan Google, MEDALI hanya menerima alamat email
          Anda, apakah Google sudah memastikan email itu, dan apakah akun itu
          dikelola oleh kampus.
        </p>
        <p>
          MEDALI tidak meminta nama, foto, kontak, atau data lain dari Google.
        </p>

        <h2 className={shared.heading}>Untuk apa dipakai</h2>
        <p>
          Email hanya dipakai untuk memastikan Anda warga kampus dan untuk
          mencocokkan Anda dengan akun MEDALI Anda.
        </p>

        <h2 className={shared.heading}>Catatan masuk</h2>
        <p>
          Setiap kali Anda masuk, keluar, atau ditolak masuk, MEDALI mencatatnya
          di catatan masuk. Percobaan masuk yang ditolak tidak menyimpan alamat
          email.
        </p>

        <h2 className={shared.heading}>Penyimpanan</h2>
        <p>
          Data disimpan di server penyedia hosting yang dipakai MEDALI untuk
          sementara, sampai MEDALI pindah ke server kampus.
        </p>
        <p>MEDALI tidak menjual atau membagikan data ini kepada pihak lain.</p>

        <h2 className={shared.heading}>Pertanyaan</h2>
        <p>
          Kirim pertanyaan tentang kebijakan ini ke{" "}
          <a
            href={`mailto:${CONTACT}`}
            className={`${shared.link} ${shared.inline}`}
          >
            {CONTACT}
          </a>
          .
        </p>

        <p className={styles.updated}>Terakhir diperbarui: 3 November 2026</p>
      </article>
    </BareScreen>
  );
}
