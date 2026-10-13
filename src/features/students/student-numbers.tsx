import type { StudentCounts } from "./added-students";
import styles from "./new-students.module.css";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function StudentNumber({
  label,
  amount,
  note,
  warned = false,
}: {
  label: string;
  amount: number;
  note: string;
  /** Set for a number that asks for work while it is above none. */
  warned?: boolean;
}) {
  const value = warned
    ? `${styles.numberValue} ${styles.numberWarned}`
    : styles.numberValue;
  return (
    <div className={styles.number}>
      <dt className={styles.numberLabel}>{label}</dt>
      <dd className={value}>{shown(amount)}</dd>
      <dd className={styles.numberNote}>{note}</dd>
    </div>
  );
}

export function StudentNumbers({ counts }: { counts: StudentCounts }) {
  return (
    <dl className={styles.numbers}>
      <StudentNumber
        label="Total mahasiswa"
        amount={counts.total}
        note={`${shown(counts.active)} aktif`}
      />
      <StudentNumber
        label="Ditambahkan lewat menu ini"
        amount={counts.added}
        note={`${shown(counts.addedActive)} berstatus aktif`}
      />
      <StudentNumber
        label="Penghuni asrama"
        amount={counts.addedResidents}
        note="dari mahasiswa yang ditambahkan"
      />
      <StudentNumber
        label="Belum punya kelompok pengasuhan"
        amount={counts.addedWithoutGroup}
        note="atur di Pengasuh > Penetapan"
        warned={counts.addedWithoutGroup > 0}
      />
    </dl>
  );
}
