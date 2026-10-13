import { deployPlanFor } from "@/db/deploy-plan";
import type { Stage } from "@/settings";
import { FILE_PLACES, filePlaceOf, placePrefix } from "./file-places";
import type { FileStore } from "./file-store";

const PREVIEW_PLACES = [FILE_PLACES["pr-preview"], FILE_PLACES["main-preview"]];

/**
 * What the file storage step asks and notes about the database of the
 * preview of `main`: whether a start of it with sample data still waits
 * for its files to be emptied.
 */
export interface MainStarts {
  waitsForFiles(): Promise<boolean>;
  noteFilesEmptied(): Promise<void>;
}

/**
 * Removes every file one kind of preview keeps, and gives how many. Only
 * the two previews' own places are ever emptied: named any other place,
 * such as that of the campus server, it refuses and removes nothing.
 */
export async function emptyPreviewFiles(
  store: FileStore,
  place: string,
): Promise<number> {
  if (!PREVIEW_PLACES.includes(place)) {
    throw new Error(
      `The files in ${place} are not those of a preview; refused to empty them.`,
    );
  }
  const keys = await store.list(placePrefix(place));
  for (const key of keys) {
    await store.remove(key);
  }
  return keys.length;
}

/**
 * The files of `main` go with the rows that name them: they are emptied
 * once for each start of its database, and kept otherwise. The start is
 * noted as done only after the files are gone, so a deploy that failed
 * here is made good by the next one.
 */
async function deployMainFiles(
  store: FileStore,
  starts: MainStarts,
): Promise<string> {
  if (!(await starts.waitsForFiles())) return "Files of main kept.";
  const place = FILE_PLACES["main-preview"];
  const removed = await emptyPreviewFiles(store, place);
  await starts.noteFilesEmptied();
  return `Files of main emptied: ${removed} removed.`;
}

/**
 * What a Vercel build does to the file storage, decided the same way as
 * for the database: a PR deploy starts the PR previews' files over, as it
 * starts their database over, and a deploy of `main` starts its files
 * over only when its database was started over. `store` is the whole
 * storage, or null while its settings are empty.
 */
export async function deployFiles(
  store: FileStore | null,
  stage: Stage,
  branch: string | undefined,
  starts: MainStarts,
): Promise<string> {
  const plan = deployPlanFor(stage, branch);
  if (!store) return "The file storage settings are empty; no file is kept.";
  if (plan === "apply-table-changes") return deployMainFiles(store, starts);
  const removed = await emptyPreviewFiles(store, filePlaceOf(stage));
  return `PR preview files emptied: ${removed} removed.`;
}
