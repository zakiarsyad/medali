import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readOwnFitness } from "./student-fitness";
import { StudentFitnessView } from "./student-fitness-view";

/**
 * "Kesehatan jasmani" of the student of the account, for Profil saya. An
 * account without the right, or without a student, gets nothing at all.
 */
export async function OwnFitnessPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const fitness = await readOwnFitness(database(), account);
  if (fitness === null) return null;
  return <StudentFitnessView fitness={fitness} isOwn />;
}
