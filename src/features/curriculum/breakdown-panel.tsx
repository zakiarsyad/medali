import shared from "@/ui/data-screen.module.css";
import { BreakdownBox } from "./breakdown-box";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import type { TahapBreakdown } from "./stage-breakdown";

/** What the six nilai mean at the chosen tahap, one box each. */
export function BreakdownPanel({
  tahapName,
  breakdown,
  values,
}: {
  tahapName: string;
  breakdown: TahapBreakdown;
  /** Every nilai with its main indicators as they are now. */
  values: ValueIndicators[];
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>
        Penjabaran MEDALI tahap {tahapName.toLowerCase()}
      </h2>
      <p className={shared.detail}>
        {breakdown.note} Indikator tahap dipilih dari indikator utama.
      </p>
      <div className={styles.breakdowns}>
        {breakdown.values.map((value) => {
          const main = values.find((candidate) => candidate.key === value.key);
          const indicators = main?.indicators ?? [];
          return (
            <BreakdownBox
              key={value.key}
              value={value}
              indicators={indicators.filter(({ code }) =>
                value.indicatorCodes.includes(code),
              )}
            />
          );
        })}
      </div>
    </section>
  );
}
