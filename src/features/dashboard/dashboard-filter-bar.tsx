import Link from "next/link";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import { CountedSelect } from "@/ui/counted-select";
import shared from "@/ui/data-screen.module.css";
import { FilterFold } from "@/ui/filter-fold";
import styles from "./dashboard.module.css";
import {
  DASHBOARD_ADDRESS,
  dashboardAddress,
  filtersInUse,
} from "./dashboard-address";
import type { DashboardView } from "./dashboard-view";
import {
  agencyChoices,
  entryPathChoices,
  nameChoices,
  programChoices,
  stageChoices,
  yesNoChoices,
  yesNoChosen,
} from "./filter-choices";
import { foundWords } from "./found-words";

/**
 * The filter for a group of students, as in the prototype but without
 * Asrama. A choice sends the filter at once, and the address keeps it.
 */
export function DashboardFilterBar({ view }: { view: DashboardView }) {
  const { filters, counts, programs, held } = view;
  const inUse = filtersInUse(filters);
  return (
    // Made anew for each address, so its lists show what the address holds.
    <AutoSubmitForm key={dashboardAddress(filters)} action={DASHBOARD_ADDRESS}>
      <section className={shared.panel} aria-label="Filter">
        <FilterFold inUse={inUse}>
          {view.stagesShown && (
            <CountedSelect
              label="Tahapan"
              name="tahap"
              every="Semua tahap"
              choices={stageChoices(counts)}
              chosen={String(filters.stageNo ?? "")}
            />
          )}
          {programs !== null && (
            <CountedSelect
              label="Program studi"
              name="prodi"
              every="Semua program studi"
              choices={programChoices(programs, counts)}
              chosen={String(filters.studyProgramId ?? "")}
            />
          )}
          <CountedSelect
            label="Reguler atau alih program"
            name="jalur"
            every="Reguler dan alih program"
            choices={entryPathChoices(counts)}
            chosen={filters.entryPath ?? ""}
          />
          <CountedSelect
            label="Provinsi"
            name="provinsi"
            every="Semua provinsi"
            choices={nameChoices(held.provinces, counts.provinces)}
            chosen={filters.province ?? ""}
          />
          <CountedSelect
            label="Afirmasi"
            name="afirmasi"
            every="Afirmasi dan non afirmasi"
            choices={yesNoChoices(
              { yes: "Afirmasi", no: "Non afirmasi" },
              counts.affirmation,
            )}
            chosen={yesNoChosen(filters.affirmation)}
          />
          <CountedSelect
            label="Pembibitan"
            name="bibit"
            every="Pembibitan dan non pembibitan"
            choices={yesNoChoices(
              { yes: "Pembibitan", no: "Non pembibitan" },
              counts.seedling,
            )}
            chosen={yesNoChosen(filters.seedling)}
          />
          <CountedSelect
            label="Internasional"
            name="inter"
            every="Internasional dan domestik"
            choices={yesNoChoices(
              { yes: "Internasional", no: "Domestik" },
              counts.international,
            )}
            chosen={yesNoChosen(filters.international)}
          />
          <CountedSelect
            label="Instansi"
            name="instansi"
            every="Semua instansi"
            choices={agencyChoices(held.agencies, counts)}
            chosen={filters.originAgency ?? ""}
          />
        </FilterFold>
        <p className={styles.found}>
          <span>
            <b>{counts.matching.toLocaleString("id-ID")}</b> {foundWords(inUse)}
          </span>
          {inUse > 0 && (
            <Link href={DASHBOARD_ADDRESS} className={shared.link}>
              Atur ulang filter
            </Link>
          )}
        </p>
      </section>
    </AutoSubmitForm>
  );
}
