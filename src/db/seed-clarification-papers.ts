import { eq, isNull } from "drizzle-orm";
import { CLARIFICATION_FILE_RULE } from "@/clarifications/clarification-file";
import { CLARIFICATION_FOLDER } from "@/features/activities/send-clarification";
import { DORM_CLARIFICATION_FOLDER } from "@/features/dorm/clarification-ids";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Database } from "./connect";
import {
  SAMPLE_PAPER_NAME,
  samplePaperBytes,
} from "./sample-clarification-paper";
import { activityClarifications, dormClarifications } from "./schema";

/** How many papers are on their way to the file storage at a time. */
const AT_A_TIME = 8;

/** Keeps one copy of the paper in a folder, and gives back its key. */
async function keptPaper(store: FileStore, folder: string): Promise<string> {
  const paper = { name: SAMPLE_PAPER_NAME, bytes: samplePaperBytes() };
  const kept = await keepFile(store, folder, paper, CLARIFICATION_FILE_RULE);
  if (!kept.ok) {
    throw new Error(`The sample paper was refused: ${kept.fault}.`);
  }
  return kept.key;
}

/** Where the papers of one kind of clarification go, and how a key is saved. */
interface PaperPlace {
  folder: string;
  saveKey: (id: string, key: string) => Promise<unknown>;
}

/** Gives each of the clarifications a copy of the paper of its own. */
async function givePapers(
  store: FileStore,
  ids: string[],
  place: PaperPlace,
): Promise<void> {
  for (let first = 0; first < ids.length; first += AT_A_TIME) {
    const together = ids.slice(first, first + AT_A_TIME);
    await Promise.all(
      together.map(async (id) =>
        place.saveKey(id, await keptPaper(store, place.folder)),
      ),
    );
  }
}

async function addActivityPapers(
  db: Database,
  store: FileStore,
): Promise<number> {
  const without = await db
    .select({ id: activityClarifications.id })
    .from(activityClarifications)
    .where(isNull(activityClarifications.fileKey));
  await givePapers(
    store,
    without.map(({ id }) => id),
    {
      folder: CLARIFICATION_FOLDER,
      saveKey: (id, fileKey) =>
        db
          .update(activityClarifications)
          .set({ fileKey })
          .where(eq(activityClarifications.id, id)),
    },
  );
  return without.length;
}

async function addDormPapers(db: Database, store: FileStore): Promise<number> {
  const without = await db
    .select({ id: dormClarifications.id })
    .from(dormClarifications)
    .where(isNull(dormClarifications.fileKey));
  await givePapers(
    store,
    without.map(({ id }) => id),
    {
      folder: DORM_CLARIFICATION_FOLDER,
      saveKey: (id, fileKey) =>
        db
          .update(dormClarifications)
          .set({ fileKey })
          .where(eq(dormClarifications.id, id)),
    },
  );
  return without.length;
}

/**
 * Gives the drawn sample paper to every clarification without a file, of
 * the character activities and of the dorm, and says how many got one.
 * That is the sample clarifications alone: the file a person sends is
 * kept before its clarification is saved. Each gets a copy of its own, as
 * each sent file has. Run a second time it finds none left. It is for
 * sample data only, so it is never run on the campus server.
 */
export async function addSamplePapers(
  db: Database,
  store: FileStore,
): Promise<number> {
  const activities = await addActivityPapers(db, store);
  const dorm = await addDormPapers(db, store);
  return activities + dorm;
}

/**
 * Adds the sample papers where there is a file storage, and says in one
 * line what was done. `store` is null while its settings are empty:
 * nothing is kept then, and the sample clarifications stay without files.
 */
export async function samplePapersAdded(
  db: Database,
  store: FileStore | null,
): Promise<string> {
  if (!store) {
    return "The file storage settings are empty; no sample paper is kept.";
  }
  const added = await addSamplePapers(db, store);
  return `Sample clarification papers added: ${added}.`;
}
