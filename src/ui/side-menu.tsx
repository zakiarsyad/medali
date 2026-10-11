import { AccountBox } from "./account-box";
import { MenuLinks } from "./menu-links";
import type { MenuItem, SignedInAs } from "./menu-types";
import styles from "./side-menu.module.css";
import { ValuesLegend } from "./values-legend";

export const sideMenuId = "side-menu";

interface SideMenuProps {
  menu: MenuItem[];
  signedInAs: SignedInAs | null;
}

/*
 * At phone width the menu is a browser popover: the button in the top bar
 * opens it, and a tap outside or the Escape key closes it, with no script
 * of our own.
 */
export function SideMenu({ menu, signedInAs }: SideMenuProps) {
  return (
    <aside id={sideMenuId} popover="auto" className={styles.side}>
      <div className={styles.brand}>
        <strong className={styles.name}>MEDALI</strong>
        <span className={styles.campus}>PKN STAN</span>
      </div>
      {signedInAs && <AccountBox signedInAs={signedInAs} />}
      <nav aria-label="Menu utama">
        <MenuLinks menu={menu} />
      </nav>
      <ValuesLegend />
    </aside>
  );
}
