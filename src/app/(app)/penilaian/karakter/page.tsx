import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { CharacterGradeScreen } from "@/features/character-grades/character-grade-screen";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import { ReadOnlyScheme } from "@/features/character-grades/read-only-scheme";
import { SchemeForm } from "@/features/character-grades/scheme-form";

/**
 * The tab Penilaian karakter: "Skema bobot", the scheme of the semester
 * character grade. Kepala Unit, with the right "Bobot penilaian", changes
 * it; every other role that opens the tab only reads it.
 */
export default async function CharacterGradePage() {
  const opened = await openPage("penilaian", "karakter");
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "karakter" };
  const inForce = await readGradeScheme(database());
  const mayChange = may(opened.account.roles, "set_grade_weights");
  return (
    <CharacterGradeScreen
      tabs={tabs}
      scheme={
        mayChange ? (
          <SchemeForm inForce={inForce} />
        ) : (
          <ReadOnlyScheme inForce={inForce} />
        )
      }
    />
  );
}
