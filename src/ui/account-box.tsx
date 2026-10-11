import Link from "next/link";
import styles from "./account-box.module.css";
import type { SignedInAs } from "./menu-types";

export function AccountBox({ signedInAs }: { signedInAs: SignedInAs }) {
  return (
    <div className={styles.box}>
      <span className={styles.label}>Masuk sebagai</span>
      <Link href="/ganti-peran" className={styles.me} aria-label="Ganti peran">
        <span className={styles.avatar}>{signedInAs.initials}</span>
        <span className={styles.who}>
          <b className={styles.name}>{signedInAs.name}</b>
          <small className={styles.roles}>
            {signedInAs.roles} · Ganti peran
          </small>
        </span>
      </Link>
    </div>
  );
}
