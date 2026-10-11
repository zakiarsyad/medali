import shared from "@/ui/data-screen.module.css";
import { IndicatorBoxes } from "./indicator-boxes";
import type { ValueIndicators } from "./main-indicators";

export function MainIndicatorsPanel({
  values,
  note,
}: {
  values: ValueIndicators[];
  /** Who changed the indicators last, or that they are the starting ones. */
  note: string;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Indikator utama MEDALI</h2>
      <p className={shared.detail}>
        Empat level per nilai, berjenjang dari tahap penanaman (level 1) sampai
        pematangan (level 4). {note}
      </p>
      <IndicatorBoxes values={values} />
    </section>
  );
}
