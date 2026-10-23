import Link from "next/link";
import { JenjangBadge } from "@/discipline-penalties/jenjang-badge";
import { StudentLink } from "@/mentoring/student-link";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./dashboard.module.css";
import { menteeDetailAddress } from "./dashboard-kind";
import type { MenteePenalty } from "./mentee-recap";

function PenaltyItem({ penalty }: { penalty: MenteePenalty }) {
  const address = penalty.opensDetail
    ? menteeDetailAddress(penalty.studentId)
    : null;
  return (
    <li className={styles.publishedItem}>
      <span className={styles.when}>{shownDay(penalty.day)}</span>
      <div className={styles.publishedBody}>
        <StudentLink name={penalty.name} address={address} />{" "}
        <JenjangBadge category={penalty.category} level={penalty.level} />
        <p className={styles.publishedLine}>{penalty.description}</p>
      </div>
    </li>
  );
}

/**
 * "Pelanggaran disiplin" of Dashboard anak asuh: the latest penalties of
 * the anak asuh, as the server sent them, and "Lihat semua" to Pembinaan
 * for an account that may open it. Not shown at all while no anak asuh
 * has one. A name opens the student's detail.
 */
export function MenteePenaltiesPanel({
  penalties,
  allAddress,
}: {
  penalties: readonly MenteePenalty[];
  allAddress: string | null;
}) {
  if (penalties.length === 0) return null;
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Pelanggaran disiplin</h3>
        {allAddress !== null && (
          <Link href={allAddress} className={shared.quiet}>
            Lihat semua
          </Link>
        )}
      </div>
      <ul className={styles.publishedList}>
        {penalties.map((penalty) => (
          <PenaltyItem key={penalty.id} penalty={penalty} />
        ))}
      </ul>
    </div>
  );
}
