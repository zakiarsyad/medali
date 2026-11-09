import styles from "./medali-logo.module.css";

const STAR =
  "32,32.5 34.3,38.8 41,39.1 35.7,43.2 37.6,49.7 32,45.9 26.4,49.7 28.3,43.2 23,39.1 29.7,38.8";

/**
 * The MEDALI logo: a medal with a star, hanging from a ribbon. It keeps
 * its own light backing, so it reads the same in dark mode. The tab icon
 * in `src/app/icon.svg` draws the same shapes.
 */
export function MedaliLogo() {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Logo MEDALI"
    >
      <rect className={styles.backing} width="64" height="64" rx="14" />
      <polygon className={styles.navy} points="16,4 27,4 37,27 28,29" />
      <polygon className={styles.gold} points="37,4 48,4 36,29 27,27" />
      <circle className={styles.gold} cx="32" cy="42" r="18" />
      <circle className={styles.navy} cx="32" cy="42" r="14.5" />
      <polygon className={styles.gold} points={STAR} />
    </svg>
  );
}
