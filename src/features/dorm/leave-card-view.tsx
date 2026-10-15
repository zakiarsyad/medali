import type { ReactNode } from "react";
import styles from "./leave.module.css";
import {
  KindBadge,
  LateBadge,
  OutBadge,
  StatusBadge,
  TimelinessBadge,
} from "./leave-badges";
import type { LeaveCard } from "./leave-card";
import { coveredWords } from "./leave-cover";
import { timeLabels } from "./leave-words";

/** One fact of a card: its name over its value. */
export function Fact({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function coveredFact(card: LeaveCard): string {
  if (card.covered.length === 0) return "Tidak ada";
  const named = card.covered.map(coveredWords).join(", ");
  return `${named} (dianggap hadir bila disetujui)`;
}

function orDash(words: string): string {
  return words === "" ? "-" : words;
}

/**
 * One request as staff see it: the student and where they live, its
 * kind and status, or Di luar asrama while the resident is out, with
 * Terlambat when the return is late, the times with the length, Keperluan, and Tujuan and
 * Kontak or, for ITMK, the dorm activities it covers. Who decided it and
 * their note, the actual return with who recorded it, and any warning,
 * follow. `children` holds what the card offers below that.
 */
export function LeaveCardView({
  card,
  children,
}: {
  card: LeaveCard;
  children?: ReactNode;
}) {
  const labels = timeLabels(card.kind);
  const isSkipping = card.kind === "skip_activities";
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <b>{card.name}</b>
          <p className={styles.quietLine}>
            {card.nim} · {card.room}
          </p>
        </div>
        <div className={styles.badges}>
          <KindBadge kind={card.kind} />
          {card.isOut ? <OutBadge /> : <StatusBadge status={card.status} />}
          {card.isLate && <LateBadge />}
        </div>
      </div>
      <dl className={styles.facts}>
        <Fact title={labels.start}>{card.start}</Fact>
        <Fact title={labels.end}>
          {card.end} ({card.length})
        </Fact>
        <Fact title="Keperluan">{card.purpose}</Fact>
        {isSkipping ? (
          <Fact title="Kegiatan asrama dalam rentang">{coveredFact(card)}</Fact>
        ) : (
          <Fact title="Tujuan dan kontak">
            {orDash(card.destination)} · {orDash(card.contact)}
          </Fact>
        )}
        {card.decision && (
          <Fact title="Diverifikasi">
            {card.decision.by}
            {card.decision.note !== "" && ` · ${card.decision.note}`}
          </Fact>
        )}
        {card.returned && (
          <Fact title="Kembali aktual">
            {card.returned.at}{" "}
            <TimelinessBadge timeliness={card.returned.timeliness} />
          </Fact>
        )}
      </dl>
      {card.returned?.recordedBy && (
        <p className={styles.quietLine}>
          Kembali dicatat {card.returned.recordedBy} (dicatat langsung).
        </p>
      )}
      {card.warnings.map((warning) => (
        <p key={warning} className={styles.warning}>
          {warning}
        </p>
      ))}
      {children}
    </li>
  );
}
