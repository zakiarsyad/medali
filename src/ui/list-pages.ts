/** How many rows one page of a list shows, unless the list says another. */
export const PAGE_SIZE = 25;

/** How many pages a number of rows fills. An empty list has one. */
export function pageCount(matching: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(matching / pageSize));
}

/** The page asked for, or the last page when there are not that many. */
export function pageWithin(
  page: number,
  matching: number,
  pageSize = PAGE_SIZE,
): number {
  return Math.min(page, pageCount(matching, pageSize));
}

/** The places in the whole list of the first and last row of a page. */
export function rowRange(
  page: number,
  matching: number,
  pageSize = PAGE_SIZE,
): { first: number; last: number } {
  const before = (page - 1) * pageSize;
  return { first: before + 1, last: Math.min(matching, before + pageSize) };
}
