import Link from "next/link";
import { DORM_IDS, DORM_SHORT_NAMES, type DormId } from "@/dorms/dorms";
import styles from "./cleaning.module.css";
import { type CleaningParams, cleaningAddress } from "./cleaning-address";

function Choice({
  dorm,
  params,
  children,
}: {
  dorm: DormId | null;
  params: CleaningParams;
  children: string;
}) {
  return (
    <Link
      href={cleaningAddress({ ...params, dorm })}
      className={styles.choice}
      aria-current={dorm === params.dorm ? "true" : undefined}
    >
      {children}
    </Link>
  );
}

/** The switch "Semua asrama" and one per dorm. It keeps the rest of the address. */
export function CleaningSwitch({ params }: { params: CleaningParams }) {
  return (
    <nav className={styles.switch} aria-label="Asrama">
      <Choice dorm={null} params={params}>
        Semua asrama
      </Choice>
      {DORM_IDS.map((dorm) => (
        <Choice key={dorm} dorm={dorm} params={params}>
          {DORM_SHORT_NAMES[dorm]}
        </Choice>
      ))}
    </nav>
  );
}
