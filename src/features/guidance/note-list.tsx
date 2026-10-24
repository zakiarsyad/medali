import type { ReactNode } from "react";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import { toneBadge } from "@/ui/tone-badge";
import {
  CATEGORY_CHOICES,
  NOTES_ADDRESS,
  type NotesParams,
  notesAddress,
  PAST_CHOICE,
} from "./note-address";
import type { NoteBoard, NoteRow } from "./note-board";
import { repeatWords } from "./note-category";
import {
  CATEGORY_WORDS,
  NO_NOTES_FOUND,
  NOT_IN_FORCE,
  NOTE_NOUN,
  punishmentText,
  semesterWords,
} from "./note-words";
import { NOTE_CATEGORIES, NOTES_PAGE_SIZE } from "./violation-note-ids";
import styles from "./violation-notes.module.css";

/** "Cari nama atau NIM", the Kategori and "Tampilkan yang sudah tidak berlaku". */
function FilterRow({ params }: { params: NotesParams }) {
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
        name="kategori"
        className={shared.input}
        defaultValue={
          params.category === "all" ? "" : CATEGORY_CHOICES[params.category]
        }
        aria-label="Kategori"
      >
        <option value="">Semua kategori</option>
        {NOTE_CATEGORIES.map((category) => (
          <option key={category} value={CATEGORY_CHOICES[category]}>
            {CATEGORY_WORDS[category]}
          </option>
        ))}
      </select>
      <label className={styles.tick}>
        <input
          type="checkbox"
          name="lama"
          value={PAST_CHOICE}
          defaultChecked={params.past}
        />
        Tampilkan yang sudah tidak berlaku
      </label>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}

function CategoryBadge({ row }: { row: NoteRow }) {
  const tone = row.category === "further" ? "warning" : null;
  return (
    <span className={toneBadge(tone)}>{CATEGORY_WORDS[row.category]}</span>
  );
}

function InForce({ row, semester }: { row: NoteRow; semester: string }) {
  if (!row.isActive) {
    return <span className={shared.badge}>{NOT_IN_FORCE}</span>;
  }
  return <span className={toneBadge("good")}>{semester}</span>;
}

function NoteLine({
  row,
  semester,
  actions,
}: {
  row: NoteRow;
  semester: string;
  /** The buttons of the row for a writer; null for a reader. */
  actions: ReactNode;
}) {
  const repeat = repeatWords(row.activeNotes);
  return (
    <tr>
      <td data-title="Tanggal">{shownDay(row.day)}</td>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {repeat === null ? row.nim : `${row.nim} · ${repeat}`}
        </small>
      </td>
      <td data-title="Kategori">
        <CategoryBadge row={row} />
      </td>
      <td data-title="Uraian">
        <span className={shared.typed}>{row.description}</span>
        {row.remark !== "" && (
          <small className={shared.detail}>{row.remark}</small>
        )}
      </td>
      <td data-title="Hukuman">
        <span className={shared.typed}>
          {punishmentText(row.punishment, row.otherPunishment)}
        </span>
      </td>
      <td data-title="Berlaku">
        <InForce row={row} semester={semester} />
        <small className={shared.detail}>{row.savedByName}</small>
      </td>
      {actions !== null && <td className={shared.rowActions}>{actions}</td>}
    </tr>
  );
}

/**
 * The list "Catatan pelanggaran": the search, the filters and one page of
 * the notes. On a phone each note is a card. A writer gets the buttons
 * `actionsOf` gives each row; a reader gets none.
 */
export function NoteListPanel({
  board,
  params,
  actionsOf,
}: {
  board: NoteBoard;
  params: NotesParams;
  actionsOf: ((row: NoteRow) => ReactNode) | null;
}) {
  const { list } = board;
  const semester = semesterWords(board.period);
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Catatan pelanggaran</h2>
      <p className={styles.sub}>Semester berjalan: {semester}</p>
      <AutoSubmitForm action={NOTES_ADDRESS}>
        <FilterRow params={params} />
      </AutoSubmitForm>
      {list.matching === 0 ? (
        <p className={shared.empty}>{NO_NOTES_FOUND}</p>
      ) : (
        <>
          <div className={shared.tableWrap}>
            <table className={`${shared.table} ${shared.stacked}`}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Mahasiswa</th>
                  <th>Kategori</th>
                  <th>Uraian</th>
                  <th>Hukuman</th>
                  <th>Berlaku</th>
                  {actionsOf !== null && (
                    <th>
                      <span className={shared.hidden}>Tindakan</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <NoteLine
                    key={row.id}
                    row={row}
                    semester={semester}
                    actions={actionsOf === null ? null : actionsOf(row)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={NOTES_PAGE_SIZE}
            noun={NOTE_NOUN}
            addressOf={(page) => notesAddress({ ...params, page })}
          />
        </>
      )}
    </section>
  );
}
