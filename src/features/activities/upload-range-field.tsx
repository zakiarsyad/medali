import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import {
  UPLOAD_COUNT_MAX,
  UPLOAD_UNIT_WORDS,
  type UploadUnit,
} from "./upload-range";

const UNITS: UploadUnit[] = ["day", "week"];

/** "Rentang unggah foto kehadiran": a number and hari or minggu. */
export function UploadRangeField({
  count,
  unit,
}: {
  /** What the field holds when the form opens. */
  count: number;
  unit: UploadUnit;
}) {
  return (
    <fieldset className={`${styles.uploadRange} ${styles.full}`}>
      <legend className={shared.label}>Rentang unggah foto kehadiran</legend>
      <span className={shared.detail}>
        Dibuka sejak kegiatan dimulai sampai
      </span>
      <input
        name="uploadCount"
        type="number"
        min={0}
        max={UPLOAD_COUNT_MAX}
        className={`${shared.input} ${styles.uploadCount}`}
        defaultValue={count}
        aria-label="Lama rentang unggah"
      />
      <select
        name="uploadUnit"
        className={shared.input}
        defaultValue={unit}
        aria-label="Satuan rentang unggah"
      >
        {UNITS.map((each) => (
          <option key={each} value={each}>
            {UPLOAD_UNIT_WORDS[each]}
          </option>
        ))}
      </select>
      <span className={shared.detail}>setelah tanggal selesai.</span>
    </fieldset>
  );
}
