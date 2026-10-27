"use client";

import { usePathname } from "next/navigation";
import styles from "./menu-links.module.css";
import type { MenuItem } from "./menu-types";
import { ChosenLink } from "./page-move";
import { opensPath } from "./page-move-rules";

export function MenuLinks({ menu }: { menu: MenuItem[] }) {
  const pathname = usePathname();
  return (
    <ul className={styles.list}>
      {menu.map((item) => (
        <li key={item.path}>
          <ChosenLink
            href={`/${item.path}`}
            isOpen={opensPath(pathname, `/${item.path}`)}
            className={styles.link}
          >
            {item.title}
            {item.count !== undefined && item.count > 0 && (
              <span className={styles.count}>
                {item.count.toLocaleString("id-ID")}
              </span>
            )}
          </ChosenLink>
        </li>
      ))}
    </ul>
  );
}
