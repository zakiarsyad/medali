import { notFound } from "next/navigation";

// No page of the app has more parts than a page and a tab, other than its
// own addresses, which are matched first. Without this file a longer
// unknown address would be answered outside the menu.
export default async function UnknownAddress(): Promise<never> {
  notFound();
}
