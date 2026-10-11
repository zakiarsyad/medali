import styles from "./side-menu.module.css";

export const sideMenuId = "side-menu";

/*
 * At phone width the menu is a browser popover: the button in the top bar
 * opens it, and a tap outside or the Escape key closes it, with no script
 * of our own.
 */
export function SideMenu() {
  return (
    <aside id={sideMenuId} popover="auto" className={styles.side}>
      <div className={styles.brand}>
        <strong className={styles.name}>MEDALI</strong>
        <span className={styles.campus}>PKN STAN</span>
      </div>
      <nav aria-label="Menu utama" />
    </aside>
  );
}
