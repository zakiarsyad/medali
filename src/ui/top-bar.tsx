import { MenuIcon } from "./menu-icon";
import { sideMenuId } from "./side-menu";
import styles from "./top-bar.module.css";

export function TopBar() {
  return (
    <header className={styles.top}>
      <button
        type="button"
        className={styles.menuButton}
        popoverTarget={sideMenuId}
        aria-label="Menu"
      >
        <MenuIcon />
      </button>
      <span className={styles.unit}>Unit Pembangunan Karakter</span>
    </header>
  );
}
