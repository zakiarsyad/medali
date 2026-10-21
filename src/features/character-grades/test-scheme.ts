import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import {
  type GradeScheme,
  STARTING_SCHEME,
} from "@/character-grades/scheme-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { typedOf } from "./scheme-fields";
import type { SentScheme } from "./scheme-input";

/** Made-up records for the checks of this area. */

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<AccountForAccess> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles, studyProgramId: null, studentId: null };
}

/** The starting scheme with these weights, as a form sends it. */
export function sentWithWeights(
  weights: GradeScheme["weights"],
  more: Partial<GradeScheme> = {},
): SentScheme {
  return typedOf({ ...STARTING_SCHEME, weights, ...more });
}
