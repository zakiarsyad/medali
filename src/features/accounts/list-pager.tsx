import Link from "next/link";
import styles from "@/ui/data-screen.module.css";

interface ListPagerProps {
  /** The page shown, starting at 0. */
  page: number;
  pageSize: number;
  total: number;
  /** What is counted, such as "pengguna". */
  unit: string;
  /** The address of another page of the same list. */
  addressOf: (page: number) => string;
}

export function ListPager({
  page,
  pageSize,
  total,
  unit,
  addressOf,
}: ListPagerProps) {
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const hasNext = to < total;
  return (
    <div className={styles.pager}>
      <span>
        {from}–{to} dari {total} {unit}
      </span>
      <span className={styles.actions}>
        {page > 0 && (
          <Link href={addressOf(page - 1)} className={styles.quiet}>
            Sebelumnya
          </Link>
        )}
        {hasNext && (
          <Link href={addressOf(page + 1)} className={styles.quiet}>
            Berikutnya
          </Link>
        )}
      </span>
    </div>
  );
}
