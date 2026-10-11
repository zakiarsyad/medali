import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import styles from "./student-list.module.css";
import {
  type StudentListFilters,
  studentListAddress,
} from "./student-list-address";
import { pageCount, rowRange } from "./student-list-pages";

/** A step to another page, or its words alone when there is no such page. */
function Step({ to, children }: { to: string | null; children: string }) {
  if (to === null) {
    return <span className={`${shared.quiet} ${styles.off}`}>{children}</span>;
  }
  return (
    <Link href={to} className={shared.quiet}>
      {children}
    </Link>
  );
}

function shown(count: number): string {
  return count.toLocaleString("id-ID");
}

/** Which rows the page shows, and the steps to the pages next to it. */
export function StudentListPager({
  filters,
  page,
  matching,
}: {
  filters: StudentListFilters;
  page: number;
  /** How many students match in all. */
  matching: number;
}) {
  const { first, last } = rowRange(page, matching);
  const hasEarlier = page > 1;
  const hasLater = page < pageCount(matching);
  return (
    <div className={shared.pager}>
      <span>
        {shown(first)}–{shown(last)} dari {shown(matching)} mahasiswa
      </span>
      <div className={shared.actions}>
        <Step to={hasEarlier ? studentListAddress(filters, page - 1) : null}>
          Sebelumnya
        </Step>
        <Step to={hasLater ? studentListAddress(filters, page + 1) : null}>
          Berikutnya
        </Step>
      </div>
    </div>
  );
}
