import type { MenuItem } from "./menu-types";

type PageItem<Id extends string> = MenuItem & { id: Id };

/**
 * The menu items of these pages, each with the number counted for it
 * beside its title, by the page's id; a page counted for nothing has none.
 */
export function withMenuCounts<Id extends string>(
  pages: readonly PageItem<Id>[],
  counts: Partial<Record<Id, number>>,
): PageItem<Id>[] {
  return pages.map((page) => {
    const count = counts[page.id];
    return count === undefined ? page : { ...page, count };
  });
}
