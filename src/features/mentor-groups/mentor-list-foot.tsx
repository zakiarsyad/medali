import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { MENTOR_PAGE_SIZE } from "./mentor-list";

const NOUN = "pengasuh";

/**
 * What stands below the list: how many mentors it holds. Only a list
 * that fills more than one page gets the steps to its other pages, and
 * says which rows the page shows.
 */
export function MentorListFoot({
  page,
  matching,
  addressOf,
}: {
  page: number;
  /** How many mentors match in all. */
  matching: number;
  /** The address of a page of the list. */
  addressOf: (page: number) => string;
}) {
  if (matching <= MENTOR_PAGE_SIZE) {
    return (
      <p className={shared.pager}>
        {matching.toLocaleString("id-ID")} {NOUN}.
      </p>
    );
  }
  return (
    <ListPager
      page={page}
      matching={matching}
      pageSize={MENTOR_PAGE_SIZE}
      noun={NOUN}
      addressOf={addressOf}
    />
  );
}
