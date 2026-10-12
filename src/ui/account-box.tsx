import Link from "next/link";
import styles from "./account-box.module.css";
import type { SignedInAs } from "./menu-types";

function Who({ signedInAs }: { signedInAs: SignedInAs }) {
  return (
    <>
      <span className={styles.avatar}>{signedInAs.initials}</span>
      <span className={styles.who}>
        <b className={styles.name}>{signedInAs.name}</b>
        <small className={styles.roles}>
          {signedInAs.roles}
          {signedInAs.maySwitch && " · Ganti peran"}
        </small>
      </span>
    </>
  );
}

export function AccountBox({ signedInAs }: { signedInAs: SignedInAs }) {
  return (
    <div className={styles.box}>
      <span className={styles.label}>Masuk sebagai</span>
      {signedInAs.maySwitch ? (
        <Link
          href="/ganti-peran"
          className={styles.me}
          aria-label="Ganti peran"
        >
          <Who signedInAs={signedInAs} />
        </Link>
      ) : (
        <div className={styles.me}>
          <Who signedInAs={signedInAs} />
        </div>
      )}
      {signedInAs.maySignOut && (
        // A plain form, sent by the browser itself: the answer is a new
        // page load, which leaves no page of the app behind to go back to.
        <form method="post" action="/keluar">
          <button type="submit" className={styles.out}>
            Keluar
          </button>
        </form>
      )}
    </div>
  );
}
