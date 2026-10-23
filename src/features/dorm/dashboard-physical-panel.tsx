import Link from "next/link";
import { DORM_IDS, DORM_SHORT_NAMES, type DormId } from "@/dorms/dorms";
import { FinalCategoryBadge } from "@/health-notes/category-badge";
import { CategoryBars } from "@/health-notes/category-bars";
import { CATEGORY_WORDS } from "@/health-notes/category-words";
import { FITNESS_CATEGORIES } from "@/health-notes/fitness-ids";
import { NO_NOTE_YET } from "@/health-notes/health-words";
import { countWords } from "@/health-notes/shown-count";
import shared from "@/ui/data-screen.module.css";
import board from "./dashboard.module.css";
import type { PhysicalPanel } from "./dashboard-health";
import type { CareRow, DormCategories } from "./dashboard-health-recap";
import {
  CARE_HEADING,
  CARE_LINK,
  NOBODY_NEEDS_CARE,
  NOBODY_TESTED,
  PHYSICAL_TOO_FEW,
  testedLine,
} from "./dashboard-health-words";
import { DORM_HEALTH_ADDRESS } from "./dorm-health-address";

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

function CareItem({ row }: { row: CareRow }) {
  return (
    <li className={board.outItem}>
      <span className={board.when}>
        <FinalCategoryBadge final={row.final} showsMark />
      </span>
      <div className={board.outBody}>
        <b>{row.name}</b> <span className={board.sub}>{row.room}</span>
        <span className={shared.detail}>{row.note ?? NO_NOTE_YET}</span>
      </div>
    </li>
  );
}

/** The residents who need care, heaviest first, with a link to the full list. */
function CareList({ care }: { care: readonly CareRow[] }) {
  return (
    <>
      <h3 className={board.subheading}>{CARE_HEADING}</h3>
      {care.length === 0 ? (
        <p className={board.none}>{NOBODY_NEEDS_CARE}</p>
      ) : (
        <ul className={board.outList}>
          {care.map((row) => (
            <CareItem key={row.id} row={row} />
          ))}
        </ul>
      )}
      <p className={board.more}>
        <Link href={DORM_HEALTH_ADDRESS}>{CARE_LINK}</Link>
      </p>
    </>
  );
}

/**
 * "Kesehatan jasmani penghuni": how many residents in reach are tested,
 * a bar per category and each dorm's counts, as the server sent them,
 * and for an account that may see names, the residents who need care.
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
      {physical.care !== null && <CareList care={physical.care} />}
    </section>
  );
}
