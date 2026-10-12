import Link from "next/link";
import shared from "./data-screen.module.css";
import { pageCount, rowRange } from "./list-pages";

/** A step to another page, or its words alone when there is no such page. */
function Step({ to, children }: { to: string | null; children: string }) {
  if (to === null) {
    return <span className={`${shared.quiet} ${shared.off}`}>{children}</span>;
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
export function ListPager({
  page,
  matching,
  noun,
  addressOf,
}: {
  page: number;
  /** How many rows the list has in all. */
  matching: number;
  /** What one row is, as the screen says it. */
  noun: string;
  /** The address of a page of the list. */
  addressOf: (page: number) => string;
}) {
  const { first, last } = rowRange(page, matching);
  const hasEarlier = page > 1;
  const hasLater = page < pageCount(matching);
  return (
    <div className={shared.pager}>
      <span>
        {shown(first)}–{shown(last)} dari {shown(matching)} {noun}
      </span>
      <div className={shared.actions}>
        <Step to={hasEarlier ? addressOf(page - 1) : null}>Sebelumnya</Step>
        <Step to={hasLater ? addressOf(page + 1) : null}>Berikutnya</Step>
      </div>
    </div>
  );
}
