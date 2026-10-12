import { deployPlanFor } from "@/db/deploy-plan";
import type { Stage } from "@/settings";
import { FILE_PLACES, filePlaceOf, placePrefix } from "./file-places";
import type { FileStore } from "./file-store";

/**
 * Removes every file the PR previews keep, and gives how many. Only their
 * own place is ever emptied: named any other place, such as that of the
 * preview of `main`, it refuses and removes nothing.
 */
export async function emptyPrPreviewFiles(
  store: FileStore,
  place: string,
): Promise<number> {
  if (place !== FILE_PLACES["pr-preview"]) {
    throw new Error(
      `The files in ${place} are not those of the PR previews; refused to empty them.`,
    );
  }
  const keys = await store.list(placePrefix(place));
  for (const key of keys) {
    await store.remove(key);
  }
  return keys.length;
}

/**
 * What a Vercel build does to the file storage, decided the same way as
 * for the database: a PR deploy starts the PR previews' files over, as it
 * starts their database over, and a deploy of `main` keeps its files.
 * `store` is the whole storage, or null while its settings are empty.
 */
export async function deployFiles(
  store: FileStore | null,
  stage: Stage,
  branch: string | undefined,
): Promise<string> {
  const plan = deployPlanFor(stage, branch);
  if (!store) return "The file storage settings are empty; no file is kept.";
  if (plan === "apply-table-changes") return "Files of main kept.";
  const removed = await emptyPrPreviewFiles(store, filePlaceOf(stage));
  return `PR preview files emptied: ${removed} removed.`;
}
