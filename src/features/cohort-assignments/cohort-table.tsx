import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { cohortAddress } from "./assignment-address";
import { NOT_FORMED_TITLE, STATUS_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import type { ListedCohort } from "./cohort-rows";

function CohortRow({
  cohort,
  isChosen,
}: {
  cohort: ListedCohort;
  isChosen: boolean;
}) {
  const address = cohortAddress(cohort.cohortYear);
  return (
    <PressableRow address={address} opens="page">
      <td data-title="Angkatan">
        <Link
          href={address}
          className={pressable.open}
          aria-current={isChosen ? "true" : undefined}
        >
          <b>{cohort.cohortYear}</b>
        </Link>{" "}
        {cohort.isNewest && <span className={shared.badge}>terbaru</span>}
      </td>
      <td data-title="Mahasiswa aktif">
        {cohort.students.toLocaleString("id-ID")}
      </td>
      <td data-title="Status penetapan">
        {cohort.status === null ? (
          <span className={styles.sub}>{NOT_FORMED_TITLE}</span>
        ) : (
          <span className={shared.badge}>{STATUS_TITLES[cohort.status]}</span>
        )}
      </td>
    </PressableRow>
  );
}

/** The "Angkatan" list. Pressing a row chooses that angkatan. */
export function CohortTable({
  cohorts,
  chosenYear,
}: {
  cohorts: ListedCohort[];
  chosenYear: number | null;
}) {
  if (cohorts.length === 0) {
    return (
      <p className={shared.empty}>
        Tidak ada angkatan yang menunggu penetapan.
      </p>
    );
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked} ${styles.cohorts}`}>
        <thead>
          <tr>
            <th>Angkatan</th>
            <th>Mahasiswa aktif</th>
            <th>Status penetapan</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <CohortRow
              key={cohort.cohortYear}
              cohort={cohort}
              isChosen={cohort.cohortYear === chosenYear}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
