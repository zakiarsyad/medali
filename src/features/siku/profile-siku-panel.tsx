import type { AccountForAccess } from "@/auth/access";
import { readGradeScheme } from "@/character-grades/grade-scheme";
import { database } from "@/db/database";
import { readOwnSiku } from "./own-siku";
import { OwnSikuPanel } from "./own-siku-panel";

/**
 * "Transparansi nilai SIKU" of the student of the account, for Profil
 * saya. An account without the right, or without a student, gets nothing
 * at all.
 */
export async function ProfileSikuPanel({
  account,
  base,
}: {
  account: AccountForAccess;
  /** Nilai dasar, set in Kurikulum. */
  base: Promise<number>;
}) {
  const db = database();
  const [answer, { scheme }, score] = await Promise.all([
    readOwnSiku(db, account),
    readGradeScheme(db),
    base,
  ]);
  if (answer.kind === "refused") return null;
  return (
    <OwnSikuPanel
      base={score}
      weight={scheme.weights.siku}
      siku={answer.siku}
    />
  );
}
