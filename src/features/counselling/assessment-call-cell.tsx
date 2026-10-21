import shared from "@/ui/data-screen.module.css";
import { AssessmentCallButton } from "./assessment-call-button";
import type { AssessmentCall } from "./assessment-calls";
import { ScheduleBadge } from "./schedule-card-parts";
import { timeWords } from "./schedule-words";

/**
 * Konseling of a row of "Teridentifikasi perlu pembinaan", for Penilai
 * Mahasiswa: "Panggil konseling" while the student has no call this
 * period, else the call's status, with its date and Jam once Konselor
 * set them. Nothing else of the call shows here.
 */
export function AssessmentCallCell({
  studentId,
  name,
  call,
}: {
  studentId: string;
  name: string;
  call: AssessmentCall | undefined;
}) {
  if (call === undefined) {
    return <AssessmentCallButton studentId={studentId} name={name} />;
  }
  return (
    <>
      <ScheduleBadge status={call.status} />
      {call.day !== null && call.hour !== null && (
        <small className={shared.detail}>
          {timeWords(call.day, call.hour)}
        </small>
      )}
    </>
  );
}
