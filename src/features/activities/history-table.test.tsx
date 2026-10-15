import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type CardsEvent, cardsAfter, NO_CARD_OPEN } from "./cards-state";
import { ClarificationForm } from "./clarification-form";
import { ClarificationFormView } from "./clarification-form-view";
import type { HistoryRow } from "./history-row";
import { historyRowOf } from "./history-row";
import { HistoryTable } from "./history-table";
import { HistoryTableView } from "./history-table-view";
import { type Drawn, draw, isPressable, offered, press } from "./test-press";
import { TEST_STUDENT_SCHEDULE } from "./test-student-schedules";

vi.mock("./clarification-actions", () => ({
  sendClarificationAction: vi.fn(),
}));

/*
 * No browser runs these checks. The table is drawn by calling its view
 * with a state that every press and every answer moves on by the real
 * rule. The form itself is left undrawn where the table is looked at;
 * its own checks draw its view.
 */

/** Two days after the upload time closed: the student is absent. */
const TODAY = "2026-10-16";
const ABSENT = historyRowOf(TEST_STUDENT_SCHEDULE, TODAY, null);
const OTHER = { ...ABSENT, id: "00000000-0000-4000-8000-0000000000c2" };
const SENT = { error: null, done: "Klarifikasi terkirim." };
const REFUSED = { error: "Tulis penjelasan minimal satu kalimat.", done: null };

function board(rows: HistoryRow[]) {
  let state = NO_CARD_OPEN;
  function tell(event: CardsEvent): void {
    state = cardsAfter(state, event);
  }
  function view(shownRows = rows) {
    return (
      <HistoryTableView
        rows={shownRows}
        state={state}
        onOpen={(cardId) => tell({ kind: "opened", cardId })}
        onCancel={() => tell({ kind: "cancelled" })}
        onAnswer={(cardId, answer) =>
          tell({ kind: "answered", cardId, state: answer })
        }
      />
    );
  }
  function drawn(shownRows = rows): Drawn {
    return draw(view(shownRows), [ClarificationForm]);
  }
  function forms(shownRows = rows) {
    return drawn(shownRows).filter(({ type }) => type === ClarificationForm);
  }
  function words(shownRows = rows): string {
    return renderToStaticMarkup(view(shownRows));
  }
  return { drawn, forms, words };
}

type FormProps = {
  scheduleId: string;
  onAnswer: (answer: typeof SENT | typeof REFUSED) => void;
  onCancel: () => void;
};

function propsOf(form: Drawn[number] | undefined): FormProps {
  if (form === undefined) throw new Error("No form is open.");
  return form.props as unknown as FormProps;
}

describe("the table of Riwayat kehadiran", () => {
  it("has the column Klarifikasi, named in every row for a phone", () => {
    const screen = renderToStaticMarkup(<HistoryTable rows={[ABSENT]} />);

    for (const title of [
      "Tanggal",
      "Kegiatan",
      "Status",
      "Keterangan",
      "Klarifikasi",
    ]) {
      expect(screen).toContain(`<th>${title}</th>`);
      expect(screen).toContain(`<td data-title="${title}">`);
    }
  });

  it('offers "Ajukan klarifikasi" for an absence while the time is open, with no form open at the start', () => {
    const table = board([ABSENT]);

    expect(offered(table.drawn())).toEqual(["Ajukan klarifikasi"]);
    expect(table.forms()).toEqual([]);
  });

  it('says "Batas klarifikasi lewat" once the time is over, with nothing to press', () => {
    const late = historyRowOf(TEST_STUDENT_SCHEDULE, "2026-10-22", null);
    const table = board([late]);

    expect(table.words()).toContain("Batas klarifikasi lewat</span>");
    expect(offered(table.drawn())).toEqual([]);
  });

  it("keeps the cell empty for an attendance that needs no clarification, so it takes no room on a phone", () => {
    const attended = historyRowOf(
      {
        ...TEST_STUDENT_SCHEDULE,
        attendance: { status: "valid", note: "", sentAt: null },
      },
      TODAY,
      null,
    );

    expect(board([attended]).words()).toContain(
      '<td data-title="Klarifikasi"></td>',
    );
  });

  it.each([
    ["submitted", "Klarifikasi diajukan"],
    ["accepted", "Klarifikasi diterima"],
    ["rejected", "Klarifikasi ditolak"],
  ] as const)(
    "shows a clarification that is %s as the badge %s",
    (status, badge) => {
      const row = historyRowOf(TEST_STUDENT_SCHEDULE, TODAY, {
        status,
        note: "Surat tidak terbaca.",
        file: null,
        removed: null,
      });

      expect(board([row]).words()).toContain(`${badge}</span>`);
    },
  );

  it.each(["submitted", "accepted", "rejected"] as const)(
    "names the file of a clarification that is %s under its badge, as a link that downloads it",
    (status) => {
      const row = historyRowOf(TEST_STUDENT_SCHEDULE, TODAY, {
        status,
        note: "",
        file: { clarificationId: "abc", name: "surat-keterangan.pdf" },
        removed: null,
      });

      const words = board([row]).words();

      expect(words).toMatch(
        /<\/span><a href="\/kegiatan\/klarifikasi\/lampiran\/abc" class="[^"]+">Lampiran: surat-keterangan\.pdf<\/a>/,
      );
      expect(words).not.toContain("lihat=1");
    },
  );

  it("names no file for a clarification whose file is not kept here", () => {
    const row = historyRowOf(TEST_STUDENT_SCHEDULE, TODAY, {
      status: "submitted",
      note: "",
      file: null,
      removed: null,
    });

    const words = board([row]).words();

    expect(words).toContain("Klarifikasi diajukan</span>");
    expect(words).not.toContain("Lampiran:");
    expect(words).not.toContain("<a ");
  });

  it('shows the note of a rejection and offers "Ajukan ulang" while the time is open', () => {
    const rejected = {
      status: "rejected",
      note: "Surat tidak terbaca.",
      file: null,
      removed: null,
    } as const;
    const open = board([historyRowOf(TEST_STUDENT_SCHEDULE, TODAY, rejected)]);
    const over = board([
      historyRowOf(TEST_STUDENT_SCHEDULE, "2026-10-22", rejected),
    ]);

    expect(open.words()).toContain("Surat tidak terbaca.</span>");
    expect(offered(open.drawn())).toEqual(["Ajukan ulang"]);
    expect(over.words()).toContain("Surat tidak terbaca.</span>");
    expect(offered(over.drawn())).toEqual([]);
  });

  it("opens the form in the row that was pressed, for the schedule of that row", () => {
    const table = board([ABSENT, OTHER]);

    // Looked through from the end, the button of the last row is found.
    press(table.drawn().reverse(), "Ajukan klarifikasi");

    expect(table.forms().map((form) => propsOf(form).scheduleId)).toEqual([
      OTHER.id,
    ]);
  });

  it("keeps one form open at a time: opening another closes the first", () => {
    const table = board([ABSENT, OTHER]);

    press(table.drawn(), "Ajukan klarifikasi");
    expect(propsOf(table.forms()[0]).scheduleId).toBe(ABSENT.id);
    press(table.drawn().reverse(), "Ajukan klarifikasi");

    expect(table.forms().map((form) => propsOf(form).scheduleId)).toEqual([
      OTHER.id,
    ]);
  });

  it('closes the form on "Batal"', () => {
    const table = board([ABSENT]);
    press(table.drawn(), "Ajukan klarifikasi");

    propsOf(table.forms()[0]).onCancel();

    expect(table.forms()).toEqual([]);
  });

  it("keeps the form open under an answer that says something is wrong", () => {
    const table = board([ABSENT]);
    press(table.drawn(), "Ajukan klarifikasi");

    propsOf(table.forms()[0]).onAnswer(REFUSED);

    expect(table.forms()).toHaveLength(1);
    expect(table.words()).toContain(
      'role="alert">Tulis penjelasan minimal satu kalimat.</p>',
    );
  });

  it('closes the form once it was sent, says "Klarifikasi terkirim." under its row, and the row then shows "Klarifikasi diajukan"', () => {
    const table = board([ABSENT]);
    press(table.drawn(), "Ajukan klarifikasi");

    propsOf(table.forms()[0]).onAnswer(SENT);
    // The page is read again after a send: the row now has its clarification.
    const waiting = historyRowOf(TEST_STUDENT_SCHEDULE, TODAY, {
      status: "submitted",
      note: "",
      file: null,
      removed: null,
    });

    expect(table.forms([waiting])).toEqual([]);
    expect(table.words([waiting])).toContain(
      'role="status">Klarifikasi terkirim.</p>',
    );
    expect(table.words([waiting])).toContain("Klarifikasi diajukan</span>");
    expect(offered(table.drawn([waiting]))).toEqual([]);
  });

  it("shows no form for a row that takes no clarification any more, though it was opened", () => {
    const table = board([ABSENT]);
    press(table.drawn(), "Ajukan klarifikasi");
    const late = historyRowOf(TEST_STUDENT_SCHEDULE, "2026-10-22", null);

    expect(table.forms([late])).toEqual([]);
  });
});

describe("the form of a clarification", () => {
  function shown(sending = false): Drawn {
    return draw(
      <ClarificationFormView
        sending={sending}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
  }

  it("asks for Alasan with the six reasons, Lampiran and Penjelasan", () => {
    const form = renderToStaticMarkup(
      <ClarificationFormView
        sending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(
      form
        .match(/<option[^>]*>[^<]+/g)
        ?.map((each) => each.replace(/<[^>]*>/, "")),
    ).toEqual([
      "Sakit",
      "Urusan keluarga mendesak",
      "Tugas institusi atau lomba",
      "Kendala teknis presensi",
      "Sudah hadir tetapi tidak tercatat",
      "Lainnya",
    ]);
    expect(form).toContain("Lampiran (PDF atau gambar, maks. 5 MB)");
    expect(form).toContain('accept="application/pdf,image/jpeg,image/png"');
    expect(form).toContain("Penjelasan");
    expect(form).toContain(
      'placeholder="Jelaskan mengapa tidak tercatat hadir"',
    );
  });

  it('offers "Kirim klarifikasi" and "Batal"', () => {
    const form = shown();

    expect(isPressable(form, "Kirim klarifikasi")).toBe(true);
    expect(isPressable(form, "Batal")).toBe(true);
  });

  it("lets neither button be pressed while it is sent, so a second press sends nothing more", () => {
    const form = shown(true);

    expect(isPressable(form, "Mengirim…")).toBe(false);
    expect(isPressable(form, "Batal")).toBe(false);
    expect(isPressable(form, "Kirim klarifikasi")).toBe(false);
  });
});
