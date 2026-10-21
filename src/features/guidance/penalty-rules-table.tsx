import shared from "@/ui/data-screen.module.css";
import styles from "./discipline-penalties.module.css";
import { SOCIAL_WORK_FORMS, SOCIAL_WORK_PLACES } from "./penalty-ids";
import { PENALTY_RULES } from "./penalty-rules";
import {
  CATEGORY_WORDS,
  capitalized,
  inSentence,
  LEVEL_WORDS,
  lengthWords,
  SOCIAL_WORK_FORM_WORDS,
  SOCIAL_WORK_PLACE_WORDS,
  scoreEffectWords,
} from "./penalty-words";

/**
 * "Ketentuan hukuman disiplin": the penalty, kerja sosial length, effect
 * on nilai karakter and Dasar of all nine Jenjang. On a phone it keeps
 * its columns and scrolls inside its own box.
 */
export function PenaltyRulesTable() {
  const forms = SOCIAL_WORK_FORMS.map((form) =>
    inSentence(SOCIAL_WORK_FORM_WORDS[form]),
  );
  const places = SOCIAL_WORK_PLACES.map((place) =>
    inSentence(SOCIAL_WORK_PLACE_WORDS[place]),
  );
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Ketentuan hukuman disiplin</h2>
      <p className={styles.sub}>
        Pengulangan perbuatan dengan ancaman lebih tinggi dikenakan hukuman yang
        lebih tinggi (ayat 6).
      </p>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${styles.rules}`}>
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Jenjang</th>
              <th>Hukuman</th>
              <th>Kerja sosial</th>
              <th>Nilai karakter</th>
              <th>Dasar</th>
            </tr>
          </thead>
          <tbody>
            {PENALTY_RULES.map((rule) => (
              <tr key={`${rule.category}-${rule.level}`}>
                <td>{rule.level === 1 ? CATEGORY_WORDS[rule.category] : ""}</td>
                <td>{capitalized(LEVEL_WORDS[rule.level])}</td>
                <td>{rule.penalty}</td>
                <td>
                  {rule.socialWork === null
                    ? "-"
                    : lengthWords(rule.socialWork)}
                </td>
                <td>{scoreEffectWords(rule)}</td>
                <td>{rule.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>
        Bentuk kerja sosial (ayat 9): {forms.join("; ")}. Lokasi (ayat 10):{" "}
        {places.join("; ")}.
      </p>
    </section>
  );
}
