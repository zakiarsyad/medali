import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { CharacterGradeScreen } from "@/features/character-grades/character-grade-screen";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import { ReadOnlyScheme } from "@/features/character-grades/read-only-scheme";

/**
 * The tab Penilaian karakter, for every role that opens it: "Skema bobot",
 * the scheme of the semester character grade.
 */
export default async function CharacterGradePage() {
  const opened = await openPage("penilaian", "karakter");
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "karakter" };
  const inForce = await readGradeScheme(database());
  return (
    <CharacterGradeScreen
      tabs={tabs}
      scheme={<ReadOnlyScheme inForce={inForce} />}
    />
  );
}
