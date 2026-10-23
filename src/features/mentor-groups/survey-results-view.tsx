import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./mentor-groups.module.css";
import { SURVEY_ADDRESS } from "./survey-address";
import type { ResultNumbers, ResultPage } from "./survey-group-list";
import type { ResultPeriod } from "./survey-result-periods";
import {
  feedbackWords,
  NO_MATCH_WORDS,
  NO_PERIOD_WORDS,
  OPEN_PERIOD_WORDS,
  periodChoiceWords,
  resultPeriodWords,
  shownNumber,
} from "./survey-result-words";
import {
  type SurveyResultChoices,
  surveyResultsAddress,
} from "./survey-results-address";
import { SurveyResultsTable } from "./survey-results-table";

const SEARCH_WORDS = "Cari kelompok atau pengasuh";

function PeriodChoice({
  periods,
  chosen,
}: {
  periods: ResultPeriod[];
  chosen: ResultPeriod;
}) {
  return (
    // Made anew for each period, so the choice shows the one the address holds.
    <AutoSubmitForm key={chosen.id} action={SURVEY_ADDRESS}>
      <select
        name="periode"
        className={`${shared.input} ${styles.fit}`}
        defaultValue={chosen.id}
        aria-label="Periode"
      >
        {periods.map((period) => (
          <option key={period.id} value={period.id}>
            {periodChoiceWords(period)}
          </option>
        ))}
      </select>
    </AutoSubmitForm>
  );
}

function Numbers({ numbers }: { numbers: ResultNumbers }) {
  const counted = `${numbers.answers.toLocaleString("id-ID")} dari ${numbers.members.toLocaleString("id-ID")} mahasiswa`;
  const feedbackNote =
    numbers.feedback === null
      ? "belum ada jawaban"
      : `setara ${shownNumber(numbers.feedback)}`;
  return (
    <NumberCards>
      <NumberCard
        label="Responden"
        amount={`${numbers.share ?? 0}%`}
        note={counted}
      />
      <NumberCard
        label="Rerata capaian karakter"
        amount={shownNumber(numbers.achievement)}
        note="rata-rata MEDALI kelompok"
      />
      <NumberCard
        label="Rerata umpan balik"
        amount={feedbackWords(numbers.feedbackOutOfFive)}
        note={feedbackNote}
      />
      <NumberCard
        label="Nilai evaluasi kurang"
        amount={numbers.poor}
        note={`dari ${numbers.groups.toLocaleString("id-ID")} kelompok`}
      />
    </NumberCards>
  );
}

function Filters({ choices }: { choices: SurveyResultChoices }) {
  return (
    // Made anew for each address, so its fields show what the address holds.
    <AutoSubmitForm key={surveyResultsAddress(choices)} action={SURVEY_ADDRESS}>
      {choices.surveyPeriodId !== null && (
        <input type="hidden" name="periode" value={choices.surveyPeriodId} />
      )}
      <div className={shared.filters}>
        <input
          name="q"
          className={shared.input}
          placeholder={SEARCH_WORDS}
          defaultValue={choices.query}
          aria-label={SEARCH_WORDS}
        />
        <select
          name="saring"
          className={shared.input}
          defaultValue={choices.filter ?? ""}
          aria-label="Filter"
        >
          <option value="">Semua kelompok</option>
          <option value="kurang">Nilai kurang</option>
          <option value="belum">Belum ada responden</option>
        </select>
        <button type="submit" className={shared.quiet}>
          Cari
        </button>
      </div>
    </AutoSubmitForm>
  );
}

/** What "Hasil evaluasi per kelompok" shows of a chosen period. */
export interface ShownResults {
  period: ResultPeriod;
  numbers: ResultNumbers;
  page: ResultPage;
}

function Results({
  shown,
  choices,
}: {
  shown: ShownResults;
  /** What the address asks for, the period it names set to the one shown. */
  choices: SurveyResultChoices;
}) {
  const { period, numbers, page } = shown;
  return (
    <>
      <Numbers numbers={numbers} />
      {period.status === "open" && (
        <p className={styles.quiet}>{OPEN_PERIOD_WORDS}</p>
      )}
      <Filters choices={choices} />
      {page.matching > 0 ? (
        <>
          <SurveyResultsTable rows={page.rows} />
          <ListPager
            page={page.page}
            matching={page.matching}
            noun="kelompok"
            keepsPlace
            addressOf={(to) => surveyResultsAddress(choices, to)}
          />
        </>
      ) : (
        <p className={shared.empty}>{NO_MATCH_WORDS}</p>
      )}
    </>
  );
}

/**
 * "Hasil evaluasi per kelompok": the period chosen with its days and
 * weights, a choice of the periods, the numbers of every group, and one
 * page of the groups, lowest first.
 */
export function SurveyResultsView({
  periods,
  shown,
  choices,
}: {
  periods: ResultPeriod[];
  /** Null while no period was opened. */
  shown: ShownResults | null;
  choices: SurveyResultChoices;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>Hasil evaluasi per kelompok</h2>
          <p className={styles.quiet}>
            {shown === null
              ? "Belum ada periode evaluasi."
              : resultPeriodWords(shown.period)}
          </p>
        </div>
        {shown !== null && (
          <PeriodChoice periods={periods} chosen={shown.period} />
        )}
      </div>
      {shown === null ? (
        <p className={shared.empty}>{NO_PERIOD_WORDS}</p>
      ) : (
        <Results
          shown={shown}
          choices={{ ...choices, surveyPeriodId: shown.period.id }}
        />
      )}
    </section>
  );
}
