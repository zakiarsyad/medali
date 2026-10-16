import type { FitnessParams } from "./fitness-address";
import { HealthNotePanel } from "./health-note-panel";
import type { HealthRecap } from "./health-recap";
import { RecapNumberCards, RecapPanel } from "./health-recap-view";
import type { RecapParams } from "./recap-address";

/**
 * The health part of Penilaian jasmani, in the prototype's order: the
 * recap's numbers, "Catatan kesehatan", and the recap. Each piece shows
 * only to the roles it is for; a role with none gets nothing here.
 */
export function HealthPart({
  recap,
  list,
  recapParams,
  writesNotes,
  today,
}: {
  /** Null for an account without the right to the recap. */
  recap: HealthRecap | null;
  list: FitnessParams;
  recapParams: RecapParams;
  writesNotes: boolean;
  today: string;
}) {
  return (
    <>
      {recap && <RecapNumberCards numbers={recap.numbers} />}
      {writesNotes && (
        <HealthNotePanel today={today} newKey={crypto.randomUUID()} />
      )}
      {recap && <RecapPanel recap={recap} list={list} params={recapParams} />}
    </>
  );
}
