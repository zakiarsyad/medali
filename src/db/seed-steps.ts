import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FileStore } from "@/files/file-store";
import type { Stage } from "@/settings";
import { readDeployTarget } from "./deploy-target";
import { rebuildTables } from "./rebuild";
import { fillWithSampleData } from "./seed";
import { samplePhotosAdded } from "./seed-attendance-photos";
import { samplePapersAdded } from "./seed-clarification-papers";
import { checkSeedStage, checkSeedTarget } from "./seed-plan";

/**
 * What the sample data command does, in order. Both checks come before
 * the tables are made again, so a refusal leaves the database as it was.
 */
export async function loadSampleData(
  db: PostgresJsDatabase,
  stage: Stage,
): Promise<string> {
  checkSeedStage(stage);
  const target = await readDeployTarget(db);
  checkSeedTarget(target.marker);
  await rebuildTables(db);
  await fillWithSampleData(db);
  return "Sample data loaded.";
}

/**
 * What the sample photos command does on a local computer, after the
 * sample data is in: it gives the sample attendance its drawn pictures
 * and the sample clarifications their drawn papers.
 * The previews get theirs from the deploy step, and the campus server
 * never does, whatever the computer the command runs on says about
 * itself. `store` is null while the file storage settings are empty.
 */
export async function loadSamplePhotos(
  db: PostgresJsDatabase,
  store: FileStore | null,
  stage: Stage,
): Promise<string> {
  if (stage !== "local") {
    throw new Error(
      `Sample photos go with sample data, so they are refused here (${stage}).`,
    );
  }
  const target = await readDeployTarget(db);
  checkSeedTarget(target.marker);
  const photos = await samplePhotosAdded(db, store);
  const papers = await samplePapersAdded(db, store);
  return `${photos}\n${papers}`;
}
