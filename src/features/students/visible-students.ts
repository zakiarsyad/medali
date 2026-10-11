import { and, inArray, or, type SQL, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { students } from "@/db/schema";
import { NOT_REMOVED } from "./student-conditions";

const NOBODY = sql`false`;

function inPrograms(ids: number[]): SQL | undefined {
  return ids.length > 0 ? inArray(students.studyProgramId, ids) : undefined;
}

function themselves(ids: string[]): SQL | undefined {
  return ids.length > 0 ? inArray(students.id, ids) : undefined;
}

/**
 * The students an account may see, for the `where` of every read of
 * student rows. A removed student is seen by nobody.
 *
 * Which mentor has which mentees is not kept yet, so the mentees of a
 * limit open no rows.
 */
export function visibleTo(limit: RowLimit): SQL {
  if (limit.kind === "all") return NOT_REMOVED;
  const allowed = or(
    inPrograms(limit.studyProgramIds),
    themselves(limit.studentIds),
  );
  return and(NOT_REMOVED, allowed ?? NOBODY) ?? NOBODY;
}
