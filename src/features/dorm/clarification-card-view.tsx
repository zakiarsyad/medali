import type { ReactNode } from "react";
import type { BadgeTone } from "@/ui/badge-tone";
import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
import {
  type CheckWords,
  type DormClarificationCard,
  fileNotOpenedWords,
} from "./clarification-card";
import type { DormClarificationStatus } from "./clarification-ids";
import { STATUS_WORDS } from "./clarification-words";
import styles from "./leave.module.css";

const STATUS_TONES: Record<DormClarificationStatus, BadgeTone> = {
  submitted: "warning",
  verified: "warning",
  accepted: "good",
  rejected: "bad",
  closed: "plain",
};

export function ClarificationStatusBadge({
  status,
}: {
  status: DormClarificationStatus;
}) {
  return (
    <span className={toneBadge(STATUS_TONES[status])}>
      {STATUS_WORDS[status]}
    </span>
  );
}

function Fact({
  title,
  isWide = false,
  children,
}: {
  title: string;
  isWide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={isWide ? styles.full : undefined}>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Check({ title, check }: { title: string; check: CheckWords | null }) {
  if (check === null) return null;
  return (
    <Fact title={title} isWide>
      {check.result} <span className={shared.detail}>{check.by}</span>
    </Fact>
  );
}

/**
 * The file of a card: its name, pressed to open it, for an account that
 * may open it, and for any other only whether there is one.
 */
function FileFact({
  card,
  onOpen,
}: {
  card: DormClarificationCard;
  onOpen: (() => void) | undefined;
}) {
  if (card.removed !== null) return card.removed;
  if (card.file === null || onOpen === undefined) {
    return fileNotOpenedWords(card.hasFile);
  }
  return (
    <button type="button" className={shared.link} onClick={onOpen}>
      {card.file.name}
    </button>
  );
}

/**
 * One clarification as a card: the resident and where they live, where
 * it stands, the activity with its day and hours, Alasan, Penjelasan,
 * Lampiran, when it was sent, and the check of BAM and the last word,
 * each with who and when. `children` is what the card offers to do, when
 * anything.
 */
export function ClarificationCardView({
  card,
  onOpenFile,
  children,
}: {
  card: DormClarificationCard;
  /** Opens the file of the card in the page. */
  onOpenFile?: () => void;
  children?: ReactNode;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <b>{card.name}</b>
          <p className={styles.quietLine}>
            {card.nim} · {card.room}
          </p>
        </div>
        <ClarificationStatusBadge status={card.status} />
      </div>
      <dl className={styles.facts}>
        <Fact title="Kegiatan">
          {card.activity} <span className={shared.detail}>{card.held}</span>
        </Fact>
        <Fact title="Alasan">{card.reason}</Fact>
        <Fact title="Penjelasan" isWide>
          {card.explanation}
        </Fact>
        <Fact title="Lampiran">
          <FileFact card={card} onOpen={onOpenFile} />
        </Fact>
        <Fact title="Diajukan">{card.sent}</Fact>
        <Check title="Verifikasi BAM" check={card.verification} />
        <Check title="Keputusan" check={card.decision} />
      </dl>
      {children}
    </li>
  );
}
