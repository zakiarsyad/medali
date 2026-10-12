import Link from "next/link";
import { entryPath } from "@/db/schema";
import type { StudyProgram } from "@/db/study-programs";
import shared from "@/ui/data-screen.module.css";
import { type CountedChoice, CountedSelect } from "./counted-select";
import { FilterFold } from "./filter-fold";
import { CATEGORIES, ENTRY_PATH_LABELS } from "./labels";
import {
  agencyChoices,
  provinceChoices,
  stageChoices,
} from "./stage-origin-choices";
import type { ChoiceCounts } from "./student-choice-counts";
import styles from "./student-list.module.css";
import {
  type StudentListFilters,
  studentListAddress,
  topFiltersInUse,
  withoutTopFilters,
} from "./student-list-address";

function programChoices(
  programs: StudyProgram[],
  counts: ChoiceCounts,
): CountedChoice[] {
  return programs.map((program) => ({
    value: String(program.id),
    shown: program.name,
    held: counts.programs.get(program.id) ?? 0,
  }));
}

function entryPathChoices(counts: ChoiceCounts): CountedChoice[] {
  return entryPath.enumValues.map((path) => ({
    value: path,
    shown: ENTRY_PATH_LABELS[path],
    held: counts.entryPaths[path],
  }));
}

function categoryChoices(counts: ChoiceCounts): CountedChoice[] {
  return CATEGORIES.map(({ field, label }) => ({
    value: field,
    shown: label,
    held: counts.categories[field],
  }));
}

/** What the number found is a number of, in the words of the prototype. */
function foundWords(filters: StudentListFilters): string {
  const inUse = topFiltersInUse(filters);
  if (inUse > 0) return `mahasiswa sesuai ${inUse} filter`;
  return filters.status === "current" ? "mahasiswa aktif" : "mahasiswa";
}

/**
 * The top bar: the Program studi, Jalur, Kategori, Tahapan, Provinsi and
 * Instansi filters.
 */
export function StudentListBar({
  filters,
  programs,
  counts,
  found,
}: {
  filters: StudentListFilters;
  programs: StudyProgram[];
  counts: ChoiceCounts;
  /** How many students match every filter. */
  found: number;
}) {
  return (
    <section className={shared.panel} aria-label="Filter">
      <FilterFold inUse={topFiltersInUse(filters)}>
        <CountedSelect
          label="Program studi"
          name="prodi"
          every="Semua program studi"
          choices={programChoices(programs, counts)}
          chosen={String(filters.studyProgramId ?? "")}
        />
        <CountedSelect
          label="Reguler atau alih program"
          name="jalur"
          every="Reguler dan alih program"
          choices={entryPathChoices(counts)}
          chosen={filters.entryPath ?? ""}
        />
        <CountedSelect
          label="Kategori"
          name="kategori"
          every="Semua kategori"
          choices={categoryChoices(counts)}
          chosen={filters.category ?? ""}
        />
        <CountedSelect
          label="Tahapan"
          name="tahap"
          every="Semua tahap"
          choices={stageChoices(counts)}
          chosen={String(filters.stageNo ?? "")}
        />
        <CountedSelect
          label="Provinsi"
          name="provinsi"
          every="Semua provinsi"
          choices={provinceChoices(counts)}
          chosen={filters.province ?? ""}
        />
        <CountedSelect
          label="Instansi"
          name="instansi"
          every="Semua instansi"
          choices={agencyChoices(counts)}
          chosen={filters.originAgency ?? ""}
        />
      </FilterFold>
      <p className={styles.found}>
        <span>
          <b>{found.toLocaleString("id-ID")}</b> {foundWords(filters)}
        </span>
        {topFiltersInUse(filters) > 0 && (
          <Link
            href={studentListAddress(withoutTopFilters(filters))}
            className={shared.link}
          >
            Atur ulang filter
          </Link>
        )}
      </p>
    </section>
  );
}
