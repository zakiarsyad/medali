import { shownDay } from "@/ui/day";
import styles from "./discipline-penalties.module.css";
import type { PenaltyRow } from "./penalty-board";
import { CHARACTER_SCORE_CAP, ruleOf } from "./penalty-rules";
import {
  formsWords,
  SOCIAL_WORK_PLACE_WORDS,
  suspensionWords,
} from "./penalty-words";

/*
 * Read by the list in the browser, so nothing here may take from the
 * database code.
 */

export const NO_DECISION_NUMBER = "Belum diisi";

function Item({
  title,
  wide = false,
  children,
}: {
  title: string;
  wide?: boolean;
  children: string;
}) {
  return (
    <div className={wide ? styles.wide : undefined}>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Bentuk, Lokasi and Periode of the kerja sosial, when the penalty has one. */
function SocialWorkItems({ row }: { row: PenaltyRow }) {
  const { socialWorkPlace, socialWorkStartsOn, socialWorkEndsOn } = row;
  if (
    socialWorkPlace === null ||
    socialWorkStartsOn === null ||
    socialWorkEndsOn === null
  ) {
    return null;
  }
  return (
    <>
      <Item title="Bentuk kerja sosial">
        {formsWords(row.socialWorkForms, row.socialWorkOther)}
      </Item>
      <Item title="Lokasi">{SOCIAL_WORK_PLACE_WORDS[socialWorkPlace]}</Item>
      <Item title="Periode">
        {`${shownDay(socialWorkStartsOn)} – ${shownDay(socialWorkEndsOn)}`}
      </Item>
    </>
  );
}

/** The effect on nilai karakter, or the suspension, of the penalty. */
function OutcomeItem({ row }: { row: PenaltyRow }) {
  const rule = ruleOf(row.category, row.level);
  if (rule.outcome === "capped") {
    return (
      <Item title="Dampak nilai">
        {`Nilai karakter paling tinggi ${CHARACTER_SCORE_CAP}`}
      </Item>
    );
  }
  if (rule.outcome === "suspended") {
    return (
      <Item title="Skorsing" wide>
        {suspensionWords(row.semester)}
      </Item>
    );
  }
  return null;
}

/**
 * "Rincian" of a penalty: Uraian, the kerja sosial, Nomor keputusan, who
 * recorded it, Dasar, and the effect on nilai karakter or the suspension.
 */
export function PenaltyDetail({ row }: { row: PenaltyRow }) {
  return (
    <dl className={styles.facts}>
      <Item title="Uraian" wide>
        {row.description}
      </Item>
      <SocialWorkItems row={row} />
      <Item title="Nomor keputusan">
        {row.decisionNumber === "" ? NO_DECISION_NUMBER : row.decisionNumber}
      </Item>
      <Item title="Dicatat oleh">{row.savedByName}</Item>
      <Item title="Dasar">{ruleOf(row.category, row.level).basis}</Item>
      <OutcomeItem row={row} />
    </dl>
  );
}
