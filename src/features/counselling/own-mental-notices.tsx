import Link from "next/link";
import {
  dataLine,
  givenSharingTitle,
  recipientsLine,
} from "@/mental-health/sharing-words";
import shared from "@/ui/data-screen.module.css";
import { studentMoves } from "./consent-rules";
import styles from "./counselling.module.css";
import type { OwnMental, OwnSharing } from "./own-mental";
import {
  CONSENT_WAITS,
  OPEN_COUNSELLING,
  SHARING_WAITS,
  WITHDRAW_ON_COUNSELLING,
} from "./own-mental-words";
import { COUNSELLING_ADDRESS } from "./schedule-address";
import { studentSharingMoves } from "./sharing-rules";

function OpenCounselling() {
  return (
    <div className={shared.actions}>
      <Link href={COUNSELLING_ADDRESS} className={shared.button}>
        {OPEN_COUNSELLING}
      </Link>
    </div>
  );
}

function WaitingNotice({ words }: { words: string }) {
  return (
    <div className={styles.warnBox}>
      <p>{words}</p>
      <OpenCounselling />
    </div>
  );
}

/** What is shared with whom, in the words of Konseling. */
function GivenSharing({ sharing }: { sharing: OwnSharing }) {
  return (
    <div className={styles.card}>
      <p>
        <b>{givenSharingTitle(sharing.status)}</b> kepada{" "}
        {recipientsLine(sharing.recipients)}: {dataLine(sharing.data)}.
      </p>
      <p className={styles.sub}>{WITHDRAW_ON_COUNSELLING}</p>
      <OpenCounselling />
    </div>
  );
}

/**
 * The notices of "Kesehatan mental": a consent or a sharing request that
 * waits for the student's answer, and a sharing they gave. Each points to
 * Konseling, the one place where they are answered or withdrawn.
 */
export function OwnMentalNotices({ mental }: { mental: OwnMental }) {
  const { consent, sharing } = mental;
  const consentWaits = studentMoves(consent).includes("approve");
  const sharingMoves = studentSharingMoves(sharing?.status ?? null);
  const sharingWaits = sharingMoves.includes("approve");
  const sharingGiven = sharingMoves.includes("withdraw");
  return (
    <>
      {consentWaits && <WaitingNotice words={CONSENT_WAITS} />}
      {sharingWaits && <WaitingNotice words={SHARING_WAITS} />}
      {sharing && sharingGiven && <GivenSharing sharing={sharing} />}
    </>
  );
}
