import { pageOpening } from "@/ui/page-change";

/**
 * Called by the router inside its own move to another page, so the sign
 * of the page opening lasts exactly as long as the move.
 */
export function onRouterTransitionStart(url: string): void {
  pageOpening(url);
}
