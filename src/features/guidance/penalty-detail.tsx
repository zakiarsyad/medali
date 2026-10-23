import type { ReactNode } from "react";
import { CHARACTER_SCORE_CAP } from "@/discipline-penalties/score-limit";
import { shownDay } from "@/ui/day";
import styles from "./discipline-penalties.module.css";
import { PenaltyConditions } from "./penalty-conditions";
import type { OpenedPenalty } from "./penalty-detail-read";
import type { PenaltyFollowUp } from "./penalty-follow-up";
import { ruleOf } from "./penalty-rules";
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
function SocialWorkItems({ penalty }: { penalty: OpenedPenalty }) {
  const { socialWorkPlace, socialWorkStartsOn, socialWorkEndsOn } = penalty;
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
        {formsWords(penalty.socialWorkForms, penalty.socialWorkOther)}
      </Item>
      <Item title="Lokasi">{SOCIAL_WORK_PLACE_WORDS[socialWorkPlace]}</Item>
      <Item title="Periode">
        {`${shownDay(socialWorkStartsOn)} – ${shownDay(socialWorkEndsOn)}`}
      </Item>
    </>
  );
}

/** The effect on nilai karakter, or the suspension, of the penalty. */
function OutcomeItem({ penalty }: { penalty: OpenedPenalty }) {
  const rule = ruleOf(penalty.category, penalty.level);
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
        {suspensionWords(penalty.semester)}
      </Item>
    );
  }
  return null;
}

/**
 * "Rincian" of a penalty: Uraian, the kerja sosial, Nomor keputusan, who
 * recorded it, Dasar, and the effect on nilai karakter or the suspension,
 * then Syarat melanjutkan studi with Keputusan where they apply, and
 * last `counselling`, given only to the account that sends to it.
 */
export function PenaltyDetail({
  penalty,
  mayFollowUp,
  onFollowUp,
  counselling = null,
}: {
  penalty: OpenedPenalty;
  mayFollowUp: boolean;
  onFollowUp: (next: PenaltyFollowUp) => void;
  counselling?: ReactNode;
}) {
  return (
    <>
      <dl className={styles.facts}>
        <Item title="Uraian" wide>
          {penalty.description}
        </Item>
        <SocialWorkItems penalty={penalty} />
        <Item title="Nomor keputusan">
          {penalty.decisionNumber === ""
            ? NO_DECISION_NUMBER
            : penalty.decisionNumber}
        </Item>
        <Item title="Dicatat oleh">{penalty.savedByName}</Item>
        <Item title="Dasar">
          {ruleOf(penalty.category, penalty.level).basis}
        </Item>
        <OutcomeItem penalty={penalty} />
      </dl>
      <PenaltyConditions
        penalty={penalty}
        mayFollowUp={mayFollowUp}
        onFollowUp={onFollowUp}
      />
      {counselling}
    </>
  );
}
