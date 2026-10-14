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
  stepsOnOnePage = true,
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
  /** Whether the steps show, as words with no link, when there is one page. */
  stepsOnOnePage?: boolean;
  /** The address of a page of the list. */
  addressOf: (page: number) => string;
}) {
  const { first, last } = rowRange(page, matching, pageSize);
  const pages = pageCount(matching, pageSize);
  const hasEarlier = page > 1;
  const hasLater = page < pages;
  const showsSteps = stepsOnOnePage || pages > 1;
  return (
    <div className={shared.pager}>
      <span>
        {shown(first)}–{shown(last)} dari {shown(matching)} {noun}
      </span>
      {showsSteps && (
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
      )}
    </div>
  );
}
