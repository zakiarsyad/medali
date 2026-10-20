import { DORM_IDS, DORM_SHORT_NAMES } from "@/dorms/dorms";
import { CATEGORY_WORDS } from "@/health-notes/category-words";
import {
  CATEGORY_CHOICES,
  FILTER_ILLNESSES,
  ILLNESS_CHOICES,
} from "@/health-notes/filter-choices";
import { FITNESS_CATEGORIES } from "@/health-notes/fitness-ids";
import {
  ILLNESS_WORDS,
  illnessLine,
  listedHint,
  medicalHint,
} from "@/health-notes/health-words";
import { SICK_PAGE_SIZE } from "@/health-notes/sick-list";
import { SickTable } from "@/health-notes/sick-table";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { DormHealthList } from "./dorm-health";
import styles from "./dorm-health.module.css";
import {
  DORM_HEALTH_ADDRESS,
  type DormHealthParams,
  dormHealthAddress,
  MARK_CHOICE,
} from "./dorm-health-address";
import {
  LISTED_NOUN,
  NOBODY_SICK,
  RESIDENT_NOUN,
  reachHint,
  SICK_LIST_SUB,
} from "./dorm-health-words";
import { markColumns } from "./mental-health-mark-badge";
import {
  MARKED_LIST_SUB,
  markLine,
  referredHint,
} from "./mental-health-mark-words";

/**
 * The four numbers of the residents the list is drawn from, and for a
 * reader of marks "Potensi kesehatan mental".
 */
export function DormHealthNumbers({ found }: { found: DormHealthList }) {
  const { numbers } = found.list;
  const { marks } = found;
  return (
    <NumberCards>
      <NumberCard
        label="Penghuni asrama"
        amount={numbers.students}
        note={reachHint(found.reach)}
      />
      <NumberCard
        label="Sakit atau punya riwayat penyakit"
        amount={numbers.listed}
        note={listedHint(numbers, RESIDENT_NOUN)}
      />
      <NumberCard
        label="Perlu perhatian"
        amount={numbers.attention}
        note="pemantauan"
      />
      <NumberCard
        label="Perlu tindak lanjut medis"
        amount={numbers.medical}
        note={medicalHint(numbers)}
      />
      {marks && (
        <NumberCard
          label="Potensi kesehatan mental"
          amount={marks.counts.marked}
          note={referredHint(marks.counts.referred)}
        />
      )}
    </NumberCards>
  );
}

/** What the illness filter shows as chosen. */
function illnessChoice(params: DormHealthParams, offersMark: boolean): string {
  if (offersMark && params.markOnly) return MARK_CHOICE;
  if (params.illness === "all") return "";
  return ILLNESS_CHOICES[params.illness];
}

/**
 * "Cari nama atau NIM" and the filters by dorm, category and illness,
 * the last with "Potensi kesehatan mental" for a reader of marks.
 */
function FilterRow({
  params,
  offersMark,
}: {
  params: DormHealthParams;
  offersMark: boolean;
}) {
  return (
    <div className={shared.filters}>
      <input
        name="cari"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={params.query}
        aria-label="Cari nama atau NIM"
      />
      <select
        name="asrama"
        className={shared.input}
        defaultValue={params.dorm === "all" ? "" : params.dorm}
        aria-label="Asrama"
      >
        <option value="">Semua asrama</option>
        {DORM_IDS.map((dorm) => (
          <option key={dorm} value={dorm}>
            {DORM_SHORT_NAMES[dorm]}
          </option>
        ))}
      </select>
      <select
        name="kategori"
        className={shared.input}
        defaultValue={
          params.category === "all" ? "" : CATEGORY_CHOICES[params.category]
        }
        aria-label="Kategori"
      >
        <option value="">Semua kategori</option>
        {FITNESS_CATEGORIES.map((category) => (
          <option key={category} value={CATEGORY_CHOICES[category]}>
            {CATEGORY_WORDS[category]}
          </option>
        ))}
      </select>
      <select
        name="riwayat"
        className={shared.input}
        defaultValue={illnessChoice(params, offersMark)}
        aria-label="Riwayat penyakit"
      >
        <option value="">Semua riwayat penyakit</option>
        {offersMark && (
          <option value={MARK_CHOICE}>Potensi kesehatan mental</option>
        )}
        {FILTER_ILLNESSES.map((illness) => (
          <option key={illness} value={ILLNESS_CHOICES[illness]}>
            {ILLNESS_WORDS[illness]}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}

/**
 * "Mahasiswa asrama yang sakit": the search, the filters and one page of
 * the residents the list holds. On a phone each resident is a card.
 */
export function DormHealthListPanel({
  found,
  params,
}: {
  found: DormHealthList;
  params: DormHealthParams;
}) {
  const { list, marks } = found;
  const { illness } = params;
  const markOnly = marks !== null && params.markOnly;
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Mahasiswa asrama yang sakit</h2>
      <p className={styles.sub}>{marks ? MARKED_LIST_SUB : SICK_LIST_SUB}</p>
      <AutoSubmitForm action={DORM_HEALTH_ADDRESS}>
        <FilterRow params={params} offersMark={marks !== null} />
      </AutoSubmitForm>
      {markOnly && list.matching > 0 && (
        <p className={styles.note}>{markLine(list.matching, LISTED_NOUN)}</p>
      )}
      {illness !== "all" && list.matching > 0 && (
        <p className={styles.note}>
          {illnessLine(list.matching, illness, LISTED_NOUN)}
        </p>
      )}
      {list.matching === 0 ? (
        <p className={shared.empty}>{NOBODY_SICK}</p>
      ) : (
        <>
          <SickTable
            rows={list.rows}
            {...(marks ? { more: markColumns(marks.byStudent) } : {})}
          />
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={SICK_PAGE_SIZE}
            noun={LISTED_NOUN}
            addressOf={(page) => dormHealthAddress({ ...params, page })}
          />
        </>
      )}
    </section>
  );
}
