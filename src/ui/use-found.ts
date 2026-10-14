import { useEffect, useState } from "react";

/** Waits for a pause in the typing, so not every letter asks the server. */
export const SEARCH_DELAY_MS = 250;

/**
 * What the server finds for a text as the person types it. A blank text
 * finds nothing and asks nobody. `search` must be the same function at
 * every draw, as an action of the server is.
 */
export function useFound<Found>(
  query: string,
  search: (query: string) => Promise<Found[]>,
): Found[] {
  const [found, setFound] = useState<Found[]>([]);
  useEffect(() => {
    let isLatest = true;
    const timer = setTimeout(async () => {
      const isBlank = query.trim() === "";
      const answer = isBlank ? [] : await search(query);
      // An answer to an earlier text must not replace a later one.
      if (isLatest) setFound(answer);
    }, SEARCH_DELAY_MS);
    return () => {
      isLatest = false;
      clearTimeout(timer);
    };
  }, [query, search]);
  return found;
}
