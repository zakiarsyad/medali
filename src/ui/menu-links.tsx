"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import styles from "./menu-links.module.css";
import type { MenuItem } from "./menu-types";
import { isWithin, markedPath } from "./page-change";
import { OpeningPage } from "./page-opening";

export function MenuLinks({ menu }: { menu: MenuItem[] }) {
  const addresses = menu.map((item) => `/${item.path}`);
  const marked = markedPath(addresses, use(OpeningPage), usePathname());
  return (
    <ul className={styles.list}>
      {menu.map((item) => (
        <li key={item.path}>
          <Link
            href={`/${item.path}`}
            className={styles.link}
            aria-current={
              isWithin(marked, `/${item.path}`) ? "page" : undefined
            }
          >
            {item.title}
            {item.count !== undefined && item.count > 0 && (
              <span className={styles.count}>
                {item.count.toLocaleString("id-ID")}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
