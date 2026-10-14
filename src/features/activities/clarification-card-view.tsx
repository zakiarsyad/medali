import type { ReactNode } from "react";
import type { ClarificationFile } from "@/clarifications/shown-file";
import shared from "@/ui/data-screen.module.css";
import base from "./activities.module.css";
import { CLARIFICATION_LOOKS } from "./badge-look";
import {
  CLARIFICATION_STATUS_WORDS,
  type ClarificationCard,
  type ClarificationSummary,
  hasDetails,
  NO_FILE,
} from "./clarification-card";
import styles from "./clarifications.module.css";
import { LookBadge } from "./look-badge";

function Fact({
  title,
  isWide = false,
  children,
}: {
  title: string;
  isWide?: boolean;
  children: ReactNode;
}) {
  const look = isWide ? `${styles.fact} ${styles.wide}` : styles.fact;
  return (
    <div className={look}>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The name of the file, pressed to open it, or a dash with no file kept. */
function FileName({
  file,
  onOpen,
}: {
  file: ClarificationFile | null;
  onOpen: (() => void) | undefined;
}) {
  if (file === null || onOpen === undefined) return NO_FILE;
  return (
    <button
      type="button"
      className={`${shared.link} ${styles.fileName}`}
      onClick={onOpen}
    >
      {file.name}
    </button>
  );
}

/**
 * One clarification as a card: the student, where it stands, the
 * activity with its days and hours, the reason, when it was sent and
 * what was decided. Penjelasan and Lampiran are drawn only for a card
 * that holds them, which is the card of the account that decides.
 * `children` is what the card offers to do, when anything.
 */
export function ClarificationCardView({
  card,
  onOpenFile,
  children,
}: {
  card: ClarificationSummary | ClarificationCard;
  /** Opens the file of the card in the page. */
  onOpenFile?: () => void;
  children?: ReactNode;
}) {
  return (
    <article className={base.card}>
      <div className={base.cardHead}>
        <div>
          <h3 className={base.cardName}>{card.name}</h3>
          <p className={base.cardText}>
            {card.nim} · {card.program}
          </p>
        </div>
        <LookBadge
          words={CLARIFICATION_STATUS_WORDS[card.status]}
          look={CLARIFICATION_LOOKS[card.status]}
        />
      </div>
      <dl className={styles.facts}>
        <Fact title="Kegiatan">
          {card.activity}
          <span className={shared.detail}>{card.held}</span>
        </Fact>
        <Fact title="Alasan">{card.reason}</Fact>
        {hasDetails(card) && (
          <>
            <Fact title="Penjelasan" isWide>
              {card.explanation}
            </Fact>
            <Fact title="Lampiran">
              <FileName file={card.file} onOpen={onOpenFile} />
            </Fact>
          </>
        )}
        <Fact title="Diajukan">{card.sent}</Fact>
        {card.decision !== null && (
          <Fact title="Keputusan" isWide>
            {card.decision.result}
            <span className={shared.detail}>{card.decision.by}</span>
          </Fact>
        )}
      </dl>
      {children}
    </article>
  );
}
