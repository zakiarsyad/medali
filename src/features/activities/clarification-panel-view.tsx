import shared from "@/ui/data-screen.module.css";
import base from "./activities.module.css";
import { ClarificationCardView } from "./clarification-card-view";
import { type ClarificationPanel, panelLine } from "./clarification-panel";

/**
 * The panel "Klarifikasi kehadiran" on "Kegiatan PPKS": how many wait,
 * were accepted and were rejected, and the newest few as cards that
 * only read, without Penjelasan and without the file.
 */
export function ClarificationPanelView({
  panel,
}: {
  panel: ClarificationPanel;
}) {
  return (
    <section className={shared.panel}>
      <div className={base.panelHead}>
        <h2 className={shared.heading}>Klarifikasi kehadiran</h2>
        <span className={base.cardText}>{panelLine(panel.counts)}</span>
      </div>
      <div className={base.cards}>
        {panel.latest.map((card) => (
          <ClarificationCardView key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
