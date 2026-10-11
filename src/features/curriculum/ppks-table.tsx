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
 * The PPKS activities of one semester, or that there are none. Each row
 * has "Ubah" when `onChange` is given.
 */
export function PpksTable({
  activities,
  onChange,
}: {
  activities: PpksActivity[];
  onChange: ((activity: PpksActivity) => void) | null;
}) {
  if (activities.length === 0) {
    return (
      <p className={shared.empty}>
        Belum ada kegiatan PPKS untuk semester ini.
      </p>
    );
  }
  return (
    <div className={shared.tableWrap}>
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Kegiatan</th>
            <th>Nilai</th>
            <th>Indikator utama</th>
            <th>Target peserta</th>
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
              <td>
                <b>{activity.name}</b>
                <span className={shared.detail}>
                  {activityNote(activity.description, activity.isRequired)}
                </span>
              </td>
              <td>
                <ValueTags keys={activity.valueKeys} />
              </td>
              <td>
                {activity.indicatorCodes.map((code) => (
                  <span key={code} className={shared.badge}>
                    {code}
                  </span>
                ))}
              </td>
              <td>{activity.targetParticipants ?? "-"}</td>
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
