import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./mentor-groups.module.css";
import { SURVEY_ADDRESS } from "./survey-address";
import { SurveyFixPart } from "./survey-fix-part";
import type { GroupSurveyDetail } from "./survey-group-detail";
import { GroupSurveyDetailView } from "./survey-group-detail-view";
import {
  type ResultNumbers,
  type ResultPage,
  rowKey,
  type SurveyGroupRow,
} from "./survey-group-list";
import { isFixable, type ResultPeriod } from "./survey-result-periods";
import {
  feedbackWords,
  fixedByWords,
  fixOfferWords,
  fixQuestion,
  NO_GROUPS_WORDS,
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
import { type OpenDetail, SurveyResultsTable } from "./survey-results-table";

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
  /** The detail of the row the address opens, or null when it opens none of the page. */
  detail: GroupSurveyDetail | null;
}

/** The row of the page the address opens, with its detail, or null. */
function openDetail(
  shown: ShownResults,
  choices: SurveyResultChoices,
): OpenDetail | null {
  const { opened } = choices;
  if (opened === null || shown.detail === null) return null;
  const key = rowKey(opened.groupId, opened.mentorId);
  const row = shown.page.rows.find((one) => one.key === key);
  if (!row) return null;
  const detail = (
    <GroupSurveyDetailView
      detail={shown.detail}
      groupId={row.group.id}
      code={groupCode(row.group)}
    />
  );
  return { key, detail };
}

/**
 * Who fixed the results and when, or what Kepala Unit is offered while a
 * period that is over is not fixed. Nothing for a period that runs.
 */
function FixPart({ shown, mayFix }: { shown: ShownResults; mayFix: boolean }) {
  const { period, numbers } = shown;
  if (period.fixed !== null) {
    return (
      <SurveyFixPart fixedWords={fixedByWords(period.fixed)} offer={null} />
    );
  }
  if (!mayFix || !isFixable(period)) return null;
  const offer = {
    surveyPeriodId: period.id,
    words: fixOfferWords(numbers.fixable),
    question: fixQuestion(numbers.fixable, period),
  };
  return <SurveyFixPart fixedWords={null} offer={offer} />;
}

/** What the list says when it shows no group: none yet in the period, or none on the filters set. */
export function noGroupWords(choices: SurveyResultChoices): string {
  const isFiltered = choices.query !== "" || choices.filter !== null;
  return isFiltered ? NO_MATCH_WORDS : NO_GROUPS_WORDS;
}

function Results({
  shown,
  choices,
  mayFix,
}: {
  shown: ShownResults;
  /** What the address asks for, the period it names set to the one shown. */
  choices: SurveyResultChoices;
  mayFix: boolean;
}) {
  const { period, numbers, page } = shown;
  const open = openDetail(shown, choices);
  function addressOf(row: SurveyGroupRow): string {
    if (row.key === open?.key) return surveyResultsAddress(choices, page.page);
    const opened = { groupId: row.group.id, mentorId: row.mentorId };
    return surveyResultsAddress(choices, page.page, opened);
  }
  return (
    <>
      <Numbers numbers={numbers} />
      <FixPart shown={shown} mayFix={mayFix} />
      {period.status === "open" && (
        <p className={styles.quiet}>{OPEN_PERIOD_WORDS}</p>
      )}
      <Filters choices={choices} />
      {page.matching > 0 ? (
        <>
          <SurveyResultsTable
            rows={page.rows}
            open={open}
            addressOf={addressOf}
          />
          <ListPager
            page={page.page}
            matching={page.matching}
            noun="kelompok"
            keepsPlace
            addressOf={(to) => surveyResultsAddress(choices, to)}
          />
        </>
      ) : (
        <p className={shared.empty}>{noGroupWords(choices)}</p>
      )}
    </>
  );
}

/**
 * "Hasil evaluasi per kelompok": the period chosen with its days and
 * weights, a choice of the periods, the numbers of every group, and one
 * page of the groups, lowest first. Kepala Unit also gets "Tetapkan hasil
 * evaluasi" for a period that is over.
 */
export function SurveyResultsView({
  periods,
  shown,
  choices,
  mayFix,
}: {
  periods: ResultPeriod[];
  /** Null while no period was opened. */
  shown: ShownResults | null;
  choices: SurveyResultChoices;
  /** Whether the account may fix the results; only a tidiness, the server checks. */
  mayFix: boolean;
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
          mayFix={mayFix}
        />
      )}
    </section>
  );
}
