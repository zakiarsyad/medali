"use client";

import shared from "./data-screen.module.css";
import styles from "./fault-notice.module.css";
import { Notice } from "./notice";

/**
 * What a screen shows when it cannot load because of a fault. The fault's
 * own words are never shown: they may name what is inside the server.
 */
export function FaultNotice({
  onRetry,
  centred = false,
}: {
  onRetry: () => void;
  /** On a page of its own, in the middle of its box. */
  centred?: boolean;
}) {
  const actions = centred
    ? `${styles.actions} ${styles.centred}`
    : styles.actions;
  return (
    <>
      <Notice title="Halaman tidak dapat ditampilkan">
        Coba lagi, atau kembali ke halaman utama.
      </Notice>
      <div className={actions}>
        <button type="button" className={shared.button} onClick={onRetry}>
          Coba lagi
        </button>
        {/* A plain link, so the home page loads anew. */}
        <a href="/" className={shared.link}>
          Kembali ke halaman utama
        </a>
      </div>
    </>
  );
}
