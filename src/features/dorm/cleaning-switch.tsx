import Link from "next/link";
import { DORM_IDS, DORM_SHORT_NAMES, type DormId } from "@/dorms/dorms";
import styles from "./cleaning.module.css";
import { type CleaningParams, cleaningAddress } from "./cleaning-address";

interface SwitchProps {
  params: CleaningParams;
  today: string;
}

function Choice({
  dorm,
  params,
  today,
  children,
}: SwitchProps & { dorm: DormId | null; children: string }) {
  return (
    <Link
      href={cleaningAddress({ ...params, dorm, page: 1 }, today)}
      className={styles.choice}
      aria-current={dorm === params.dorm ? "true" : undefined}
    >
      {children}
    </Link>
  );
}

/** The switch "Semua asrama" and one per dorm. It keeps the date shown. */
export function CleaningSwitch({ params, today }: SwitchProps) {
  return (
    <nav className={styles.switch} aria-label="Asrama">
      <Choice dorm={null} params={params} today={today}>
        Semua asrama
      </Choice>
      {DORM_IDS.map((dorm) => (
        <Choice key={dorm} dorm={dorm} params={params} today={today}>
          {DORM_SHORT_NAMES[dorm]}
        </Choice>
      ))}
    </nav>
  );
}
