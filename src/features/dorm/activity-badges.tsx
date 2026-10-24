import type { BadgeTone } from "@/ui/badge-tone";
import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
import type { Organiser } from "./activity-ids";
import { type ActivityState, STATE_WORDS } from "./activity-state";
import { ORGANISER_WORDS } from "./activity-words";

const STATE_TONES: Record<ActivityState, BadgeTone> = {
  coming: "plain",
  today_not_started: "warning",
  running: "good",
  over: "plain",
};

/** Where an activity stands, in the look of how far it is. */
export function StateBadge({ state }: { state: ActivityState }) {
  return (
    <span className={toneBadge(STATE_TONES[state])}>{STATE_WORDS[state]}</span>
  );
}

/** BAM keeps the gold of a plain badge, as in the prototype. */
const ORGANISER_TONES: Record<Organiser, BadgeTone | null> = {
  upk: "good",
  coach: "warning",
  bam: null,
};

/** The penanggung jawab, by its short name. */
export function OrganiserBadge({ organiser }: { organiser: Organiser }) {
  return (
    <span className={toneBadge(ORGANISER_TONES[organiser])}>
      {ORGANISER_WORDS[organiser]}
    </span>
  );
}

/** Rutin or Non rutin. */
export function KindBadge({ isRoutine }: { isRoutine: boolean }) {
  if (!isRoutine) return <span className={shared.badge}>Non rutin</span>;
  return <span className={toneBadge("plain")}>Rutin</span>;
}
