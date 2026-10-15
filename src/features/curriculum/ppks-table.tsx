import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./curriculum.module.css";
import { activityNote, type PpksActivity } from "./ppks-activities";

function ValueTags({ keys }: { keys: PpksActivity["valueKeys"] }) {
  const chosen = MEDALI_VALUES.filter((value) => keys.includes(value.key));
  return chosen.map((value) => (
    <span key={value.key} className={styles.valueTag}>
      <ValueSwatch value={value.key} />
      {value.name}
    </span>
  ));
}

/**
 * A typed target, written with a dot for thousands. Without one, the
 * number the app fills in, written the same way and marked so staff can
 * tell it from a typed one, or "-" when the list has none to fill in.
 */
function Target({
  typed,
  auto,
}: {
  typed: number | null;
  auto: number | null;
}) {
  if (typed !== null) return typed.toLocaleString("id-ID");
  if (auto === null) return "-";
  return (
    <>
      {auto.toLocaleString("id-ID")}{" "}
      <span className={styles.autoMark}>otomatis</span>
    </>
  );
}

/**
 * The activities of one list, or that there are none. Each row has "Ubah"
 * when `onChange` is given.
 */
export function PpksTable({
  activities,
  emptyText,
  onChange,
  autoTarget,
}: {
  activities: PpksActivity[];
  emptyText: string;
  onChange: ((activity: PpksActivity) => void) | null;
  /** The target of an activity with none typed, or null for none. */
  autoTarget: number | null;
}) {
  if (activities.length === 0) {
    return <p className={shared.empty}>{emptyText}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Kegiatan</th>
            <th>Nilai</th>
            <th>Indikator utama</th>
            <th>Target peserta</th>
            <th>Dijadwalkan</th>
            {onChange && (
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td data-title="Kegiatan">
                <b>{activity.name}</b>
                <span className={shared.detail}>
                  {activityNote(activity.description, activity.isRequired)}
                </span>
              </td>
              <td data-title="Nilai">
                <ValueTags keys={activity.valueKeys} />
              </td>
              <td data-title="Indikator utama">
                {activity.indicatorCodes.map((code) => (
                  <span key={code} className={shared.badge}>
                    {code}
                  </span>
                ))}
              </td>
              <td data-title="Target peserta">
                <Target typed={activity.targetParticipants} auto={autoTarget} />
              </td>
              <td data-title="Dijadwalkan">{activity.scheduledCount}×</td>
              {onChange && (
                <td>
                  <button
                    type="button"
                    className={shared.link}
                    onClick={() => onChange(activity)}
                  >
                    Ubah
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
