import Link from "next/link";
import shared from "./data-screen.module.css";
import { PAGE_SIZE, pageCount, rowRange } from "./list-pages";

/** A step to another page, or its words alone when there is no such page. */
function Step({
  to,
  keepsPlace,
  children,
}: {
  to: string | null;
  keepsPlace: boolean;
  children: string;
}) {
  if (to === null) {
    return <span className={`${shared.quiet} ${shared.off}`}>{children}</span>;
  }
  return (
    <Link href={to} className={shared.quiet} scroll={!keepsPlace}>
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
  pageSize = PAGE_SIZE,
  noun,
  keepsPlace = false,
  addressOf,
}: {
  page: number;
  /** How many rows the list has in all. */
  matching: number;
  /** How many rows a page of this list shows. */
  pageSize?: number;
  /** What one row is, as the screen says it. */
  noun: string;
  /**
   * Whether a step leaves the screen where it is scrolled to, as for a
   * list far down a page: a step otherwise goes back to the top.
   */
  keepsPlace?: boolean;
  /** The address of a page of the list. */
  addressOf: (page: number) => string;
}) {
  const { first, last } = rowRange(page, matching, pageSize);
  const hasEarlier = page > 1;
  const hasLater = page < pageCount(matching, pageSize);
  return (
    <div className={shared.pager}>
      <span>
        {shown(first)}–{shown(last)} dari {shown(matching)} {noun}
      </span>
      <div className={shared.actions}>
        <Step
          to={hasEarlier ? addressOf(page - 1) : null}
          keepsPlace={keepsPlace}
        >
          Sebelumnya
        </Step>
        <Step
          to={hasLater ? addressOf(page + 1) : null}
          keepsPlace={keepsPlace}
        >
          Berikutnya
        </Step>
      </div>
    </div>
  );
}
