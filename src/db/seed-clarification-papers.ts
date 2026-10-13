import { eq, isNull } from "drizzle-orm";
import {
  CLARIFICATION_FILE_RULE,
  CLARIFICATION_FOLDER,
} from "@/features/activities/clarification-file";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Database } from "./connect";
import {
  SAMPLE_PAPER_NAME,
  samplePaperBytes,
} from "./sample-clarification-paper";
import { activityClarifications } from "./schema";

/** How many papers are on their way to the file storage at a time. */
const AT_A_TIME = 8;

async function addSamplePaper(
  db: Database,
  store: FileStore,
  clarificationId: string,
  paper: { name: string; bytes: Uint8Array },
): Promise<void> {
  const kept = await keepFile(
    store,
    CLARIFICATION_FOLDER,
    paper,
    CLARIFICATION_FILE_RULE,
  );
  if (!kept.ok) {
    throw new Error(`The sample paper was refused: ${kept.fault}.`);
  }
  await db
    .update(activityClarifications)
    .set({ fileKey: kept.key })
    .where(eq(activityClarifications.id, clarificationId));
}

/**
 * Gives the drawn sample paper to every clarification without a file,
 * and says how many got one. That is the sample clarifications alone:
 * the file a person sends is kept before its clarification is saved.
 * Each gets a copy of its own, as each sent file has. Run a second time
 * it finds none left. It is for sample data only, so it is never run on
 * the campus server.
 */
export async function addSamplePapers(
  db: Database,
  store: FileStore,
): Promise<number> {
  const without = await db
    .select({ id: activityClarifications.id })
    .from(activityClarifications)
    .where(isNull(activityClarifications.fileKey));
  const paper = { name: SAMPLE_PAPER_NAME, bytes: samplePaperBytes() };
  for (let first = 0; first < without.length; first += AT_A_TIME) {
    const together = without.slice(first, first + AT_A_TIME);
    await Promise.all(
      together.map(({ id }) => addSamplePaper(db, store, id, paper)),
    );
  }
  return without.length;
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
