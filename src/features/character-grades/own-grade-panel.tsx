import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { readOwnGrade } from "@/character-grades/own-grade";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import styles from "./character-grades.module.css";
import { StudentGradeView } from "./student-grade-view";

/** The card while the student has no grade this semester. */
export function OwnGradeNotYet() {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Nilai karakter (KEP-220)</h2>
      <p className={styles.note}>Nilai karakter semester ini belum tersedia.</p>
    </section>
  );
}

/**
 * "Nilai karakter (KEP-220)" of the student of the account, for Profil
 * saya. An account without the right gets nothing at all.
 */
export async function OwnGradePanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const own = await readOwnGrade(database(), account, campusDay());
  if (own === null) return null;
  if (own.grade === null) return <OwnGradeNotYet />;
  return (
    <StudentGradeView grade={own.grade} own={{ skpmPoints: own.skpmPoints }} />
  );
}
