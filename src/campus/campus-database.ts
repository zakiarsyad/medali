import type { DatabaseKind } from "@/db/deploy-plan";

/**
 * Checks the database the campus server package was given, before
 * anything in it is changed. One that carries no mark yet is marked as
 * the campus one, so the sample data command refuses it from anywhere.
 */
export function checkCampusDatabase(
  marker: DatabaseKind | null,
): "go" | "mark-and-go" {
  if (marker === "campus") return "go";
  if (marker === null) return "mark-and-go";
  throw new Error(
    `This database is marked ${marker}: it holds sample data and is not the campus server's; refused to start.`,
  );
}
