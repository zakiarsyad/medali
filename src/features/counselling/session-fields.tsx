import { campusDay } from "@/academic-periods/campus-day";
import { COUNSELLING_TOPICS } from "@/mental-health/schedule-ids";
import {
  SESSION_FOLLOW_UPS,
  SESSION_KINDS,
  SESSION_NOTES_MAX,
  type SessionContent,
} from "@/mental-health/session-ids";
import {
  FOLLOW_UP_WORDS,
  SESSION_KIND_WORDS,
} from "@/mental-health/session-words";
import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import { ChoiceOptions } from "./schedule-options";
import { TOPIC_WORDS } from "./schedule-words";

/** What the fields start with; a field not given starts with its first choice. */
export type SessionDefaults = Partial<SessionContent>;

/**
 * The fields of a session: Tanggal sesi, Jenis, Topik utama, "Catatan
 * sesi (rahasia)", Tindak lanjut and Sesi berikutnya. Tanggal sesi
 * starts with today on campus when no day is given.
 */
export function SessionFields({
  defaults = {},
}: {
  defaults?: SessionDefaults;
}) {
  const today = campusDay();
  return (
    <>
      <label className={shared.field}>
        Tanggal sesi
        <input
          name="day"
          type="date"
          className={shared.input}
          max={today}
          defaultValue={defaults.day ?? today}
        />
      </label>
      <label className={shared.field}>
        Jenis
        <select
          name="kind"
          className={shared.input}
          defaultValue={defaults.kind}
        >
          <ChoiceOptions choices={SESSION_KINDS} words={SESSION_KIND_WORDS} />
        </select>
      </label>
      <label className={shared.field}>
        Topik utama
        <select
          name="topic"
          className={shared.input}
          defaultValue={defaults.topic}
        >
          <ChoiceOptions choices={COUNSELLING_TOPICS} words={TOPIC_WORDS} />
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Catatan sesi (rahasia)
        <textarea
          name="notes"
          rows={4}
          maxLength={SESSION_NOTES_MAX}
          placeholder="Hanya dapat dibaca konselor"
          className={shared.input}
          defaultValue={defaults.notes}
        />
      </label>
      <label className={shared.field}>
        Tindak lanjut
        <select
          name="followUp"
          className={shared.input}
          defaultValue={defaults.followUp}
        >
          <ChoiceOptions choices={SESSION_FOLLOW_UPS} words={FOLLOW_UP_WORDS} />
        </select>
      </label>
      <label className={shared.field}>
        Sesi berikutnya (opsional)
        <input
          name="nextDay"
          type="date"
          className={shared.input}
          defaultValue={defaults.nextDay ?? undefined}
        />
      </label>
    </>
  );
}
