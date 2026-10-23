import { DORM_IDS, DORM_SHORT_NAMES, type DormId } from "@/dorms/dorms";
import { CategoryBars } from "@/health-notes/category-bars";
import { CATEGORY_WORDS } from "@/health-notes/category-words";
import { FITNESS_CATEGORIES } from "@/health-notes/fitness-ids";
import { countWords } from "@/health-notes/shown-count";
import shared from "@/ui/data-screen.module.css";
import board from "./dashboard.module.css";
import type { PhysicalPanel } from "./dashboard-health";
import type { DormCategories } from "./dashboard-health-recap";
import {
  NOBODY_TESTED,
  PHYSICAL_TOO_FEW,
  testedLine,
} from "./dashboard-health-words";

/** Each dorm's count per category. On a phone each dorm is a card of its own. */
function DormTable({ byDorm }: { byDorm: Record<DormId, DormCategories> }) {
  return (
    <table className={`${shared.table} ${shared.stacked} ${board.dormTable}`}>
      <thead>
        <tr>
          <th>Asrama</th>
          {FITNESS_CATEGORIES.map((category) => (
            <th key={category}>{CATEGORY_WORDS[category]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DORM_IDS.map((dorm) => (
          <tr key={dorm}>
            <td className={shared.rowHeading} data-title="Asrama">
              {DORM_SHORT_NAMES[dorm]}
            </td>
            {FITNESS_CATEGORIES.map((category) => (
              <td key={category} data-title={CATEGORY_WORDS[category]}>
                {countWords(byDorm[dorm][category])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhysicalCounts({ physical }: { physical: PhysicalPanel }) {
  const { recap, byDorm, limits } = physical;
  if (recap.kind === "untested") {
    return <p className={board.none}>{NOBODY_TESTED}</p>;
  }
  if (recap.kind === "too_few" || byDorm === null) {
    return <p className={board.none}>{PHYSICAL_TOO_FEW}</p>;
  }
  return (
    <>
      <CategoryBars counts={recap.byCategory} limits={limits} />
      <DormTable byDorm={byDorm} />
    </>
  );
}

/**
 * "Kesehatan jasmani penghuni": how many residents in reach are tested,
 * a bar per category and each dorm's counts, as the server sent them.
 */
export function PhysicalHealthPanel({ physical }: { physical: PhysicalPanel }) {
  const { recap } = physical;
  return (
    <section className={shared.panel}>
      <div className={board.head}>
        <h2 className={shared.heading}>Kesehatan jasmani penghuni</h2>
        {recap.kind === "shown" && (
          <span className={board.sub}>
            {testedLine(recap.tested, recap.students)}
          </span>
        )}
      </div>
      <PhysicalCounts physical={physical} />
    </section>
  );
}
