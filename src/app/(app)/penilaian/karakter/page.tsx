import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { CharacterGradeScreen } from "@/features/character-grades/character-grade-screen";
import { readGradeParams } from "@/features/character-grades/grade-address";
import { readGradeInputs } from "@/features/character-grades/grade-inputs";
import {
  gradeListOf,
  gradeRowOf,
} from "@/features/character-grades/grade-list";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import { gradeVisibleTo } from "@/features/character-grades/grade-students";
import { ReadOnlyScheme } from "@/features/character-grades/read-only-scheme";
import { SchemeForm } from "@/features/character-grades/scheme-form";

/**
 * The tab Penilaian karakter: "Skema bobot", the scheme of the semester
 * character grade, and "Daftar nilai karakter". Kepala Unit, with the
 * right "Bobot penilaian", changes the scheme; every other role that
 * opens the tab only reads it. Each role sees the grades of the students
 * its roles that open the tab see: Ketua Program Studi those of their own
 * program only, Pengasuh their own mentees only. Nothing here writes a
 * grade: each is worked out on every load from its parts.
 */
export default async function CharacterGradePage(
  props: PageProps<"/penilaian/karakter">,
) {
  const opened = await openPage("penilaian", "karakter");
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "karakter" };
  const params = readGradeParams(await props.searchParams);
  const db = database();
  const [inForce, { inputs }] = await Promise.all([
    readGradeScheme(db),
    readGradeInputs(db, gradeVisibleTo(opened.account), campusDay()),
  ]);
  const rows = inputs.map((input) => gradeRowOf(input, inForce.scheme));
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
      params={params}
      list={gradeListOf(rows, params)}
    />
  );
}
