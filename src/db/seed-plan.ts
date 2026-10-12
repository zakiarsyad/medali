import type { Stage } from "@/settings";
import type { DatabaseKind } from "./deploy-plan";

/** Refuses the sample data anywhere but on a local computer. */
export function checkSeedStage(stage: Stage): void {
  // The previews get their sample data from the deploy step.
  if (stage === "local") return;
  throw new Error(
    `Sample data replaces all data, so it is refused here (${stage}).`,
  );
}

/**
 * Refuses the database of the campus server, whatever the computer the
 * command runs on says about itself: its mark is in the database.
 */
export function checkSeedTarget(marker: DatabaseKind | null): void {
  if (marker !== "campus") return;
  throw new Error(
    "This database is marked campus: it holds real data, which sample data would replace; refused.",
  );
}
