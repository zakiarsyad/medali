import { currentAccount } from "@/auth/current-account";
import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import styles from "@/ui/data-screen.module.css";
import { Notice } from "@/ui/notice";

export default async function Forbidden() {
  const account = await currentAccount();
  if (!account) {
    return (
      <Notice title="Sesi berakhir">
        Sesi Anda berakhir.{" "}
        {/* A plain link, so the sign-in page loads anew. */}
        <a href={SIGN_IN_PATH} className={styles.link}>
          Masuk lagi.
        </a>
      </Notice>
    );
  }
  return (
    <Notice title="Akses ditolak">
      Peran Anda tidak dapat membuka halaman ini. Pilih halaman lain dari menu.
    </Notice>
  );
}
