"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./menu-links.module.css";
import type { MenuItem } from "./menu-types";

function isOpen(pathname: string, path: string): boolean {
  return pathname === `/${path}` || pathname.startsWith(`/${path}/`);
}

export function MenuLinks({ menu }: { menu: MenuItem[] }) {
  const pathname = usePathname();
  return (
    <ul className={styles.list}>
      {menu.map((item) => (
        <li key={item.path}>
          <Link
            href={`/${item.path}`}
            className={styles.link}
            aria-current={isOpen(pathname, item.path) ? "page" : undefined}
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
