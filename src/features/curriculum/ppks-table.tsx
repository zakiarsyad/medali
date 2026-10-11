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

/** The PPKS activities of one semester, or that there are none. */
export function PpksTable({ activities }: { activities: PpksActivity[] }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
