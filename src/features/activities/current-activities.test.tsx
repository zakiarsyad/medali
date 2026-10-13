import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type ActivityCard, cardOf } from "./activity-card";
import { type CardsEvent, cardsAfter, NO_CARD_OPEN } from "./cards-state";
import { CurrentActivities } from "./current-activities";
import { CurrentActivitiesView } from "./current-activities-view";
import { PhotoSender } from "./photo-sender";
import type { StudentSchedule } from "./student-schedule";
import { type Drawn, draw, offered, press } from "./test-press";
import {
  TEST_NOW,
  TEST_SENT_PHOTO,
  TEST_STUDENT_SCHEDULE,
} from "./test-student-schedules";

vi.mock("./actions", () => ({ sendAttendancePhotoAction: vi.fn() }));

const BUTTON = "Unggah foto kehadiran";
const OPEN_CARD = cardOf(TEST_STUDENT_SCHEDULE, TEST_NOW);
const OTHER_CARD = { ...OPEN_CARD, id: "00000000-0000-4000-8000-0000000000c2" };
const KEPT = {
  error: null,
  done: "Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.",
};
const CLOSED = { error: "Masa unggah foto sudah ditutup.", done: null };

function shown(schedule: StudentSchedule, now = TEST_NOW): string {
  return renderToStaticMarkup(
    <CurrentActivities cards={[cardOf(schedule, now)]} />,
  );
}

/** Stands in for the way the cards start a send that outlives one card. */
function startSendNow(send: () => Promise<void>): void {
  void send();
}

/**
 * The running cards as the screen part keeps them: drawn from a state
 * that every press and every answer moves on by the real rule. The
 * upload itself is left undrawn here; its own checks press its buttons.
 */
function board(cards: ActivityCard[]) {
  let state = NO_CARD_OPEN;
  function tell(event: CardsEvent): void {
    state = cardsAfter(state, event);
  }
  function view(shownCards = cards) {
    return (
      <CurrentActivitiesView
        cards={shownCards}
        state={state}
        startSend={startSendNow}
        onOpen={(cardId) => tell({ kind: "opened", cardId })}
        onCancel={() => tell({ kind: "cancelled" })}
        onAnswer={(cardId, answer) =>
          tell({ kind: "answered", cardId, state: answer })
        }
      />
    );
  }
  return {
    drawn: (shownCards = cards) => draw(view(shownCards), [PhotoSender]),
    markup: (shownCards = cards) => renderToStaticMarkup(view(shownCards)),
  };
}

function uploadsOf(drawn: Drawn) {
  return drawn.filter(({ type }) => type === PhotoSender);
}

/** What the open upload of the cards is told to do when it has an answer. */
function answerOf(drawn: Drawn) {
  const [upload] = uploadsOf(drawn);
  if (!upload) throw new Error("No upload is open.");
  return upload.props.onAnswer as (answer: typeof KEPT | typeof CLOSED) => void;
}

describe("CurrentActivities", () => {
  it('offers "Unggah foto kehadiran" while the upload time is open and nothing was sent', () => {
    expect(shown(TEST_STUDENT_SCHEDULE)).toContain(`${BUTTON}</button>`);
  });

  it("offers no upload before the first hour of the schedule", () => {
    const early = { day: "2026-10-13", time: "07:00" };

    expect(shown(TEST_STUDENT_SCHEDULE, early)).not.toContain(BUTTON);
  });

  it.each(["waiting", "valid", "rejected", "dispensation"] as const)(
    "offers no upload when the attendance is %s",
    (status) => {
      const attendance = { ...TEST_SENT_PHOTO, status };

      expect(shown({ ...TEST_STUDENT_SCHEDULE, attendance })).not.toContain(
        BUTTON,
      );
    },
  );
});

describe('pressing "Unggah foto kehadiran"', () => {
  it('opens the upload of that card, with "Ambil foto", "Pilih gambar" and "Batal" in place of the button', () => {
    const { drawn, markup } = board([OPEN_CARD]);

    press(drawn(), BUTTON);

    expect(uploadsOf(drawn()).map(({ props }) => props.scheduleId)).toEqual([
      OPEN_CARD.id,
    ]);
    expect(offered(drawn())).toEqual([]);
    for (const words of ["Ambil foto", "Pilih gambar", "Batal"]) {
      expect(markup()).toContain(words);
    }
    expect(markup()).not.toContain(BUTTON);
  });

  it("gives every upload the cards' own way to start a send, which stays when the upload's card closes", () => {
    const { drawn } = board([OPEN_CARD, OTHER_CARD]);

    press(drawn(), BUTTON);
    const first = uploadsOf(drawn())[0]?.props.startSend;
    press(drawn(), BUTTON);
    const [other] = uploadsOf(drawn());

    expect(other?.props.scheduleId).toBe(OTHER_CARD.id);
    expect(first).toBe(startSendNow);
    expect(other?.props.startSend).toBe(startSendNow);
  });

  it("opens one upload at a time: opening another card's closes the first", () => {
    const { drawn } = board([OPEN_CARD, OTHER_CARD]);

    press(drawn(), BUTTON);
    press(drawn(), BUTTON);

    expect(uploadsOf(drawn()).map(({ props }) => props.scheduleId)).toEqual([
      OTHER_CARD.id,
    ]);
    expect(offered(drawn())).toEqual([BUTTON]);
  });

  it('shows the button again, and no message, when the upload is closed with "Batal"', () => {
    const { drawn, markup } = board([OPEN_CARD]);
    press(drawn(), BUTTON);

    const [upload] = uploadsOf(drawn());
    if (!upload) throw new Error("No upload is open.");
    (upload.props.onCancel as () => void)();

    expect(uploadsOf(drawn())).toEqual([]);
    expect(offered(drawn())).toEqual([BUTTON]);
    expect(markup()).not.toContain('role="status"');
    expect(markup()).not.toContain('role="alert"');
  });
});

describe("the answer to a sent photo", () => {
  it("closes the upload when the photo was kept, and says so under the card, which no longer offers an upload", () => {
    const { drawn, markup } = board([OPEN_CARD]);
    const waiting = { ...OPEN_CARD, maySend: false };
    press(drawn(), BUTTON);

    answerOf(drawn())(KEPT);

    expect(uploadsOf(drawn([waiting]))).toEqual([]);
    expect(offered(drawn([waiting]))).toEqual([]);
    expect(markup([waiting])).toContain(
      'role="status">Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.</p></article>',
    );
  });

  it("leaves the upload open when the photo was refused, with the message under the card, so it can be sent again", () => {
    const { drawn, markup } = board([OPEN_CARD]);
    const refused = {
      error: "Foto tidak dapat disimpan. Coba lagi.",
      done: null,
    };
    press(drawn(), BUTTON);

    answerOf(drawn())(refused);

    expect(uploadsOf(drawn())).toHaveLength(1);
    expect(markup()).toContain(
      'role="alert">Foto tidak dapat disimpan. Coba lagi.</p></article>',
    );
  });

  it("stays above the cards when its card is gone, as after the upload time has closed", () => {
    const { drawn, markup } = board([OPEN_CARD]);
    press(drawn(), BUTTON);

    answerOf(drawn())(CLOSED);

    expect(markup([])).toMatch(
      /<\/h2><p class="[^"]*" role="alert">Masa unggah foto sudah ditutup\.<\/p>/,
    );
    expect(markup([])).toContain(
      "Tidak ada kegiatan yang sedang membuka unggah foto.",
    );
  });

  it("is cleared when another upload is opened", () => {
    const { drawn, markup } = board([OPEN_CARD, OTHER_CARD]);
    press(drawn(), BUTTON);
    answerOf(drawn())(KEPT);

    press(drawn(), BUTTON);

    expect(markup()).not.toContain("Foto kehadiran terunggah.");
  });

  it("leaves another card's upload open when it arrives after that one was opened", () => {
    const { drawn, markup } = board([OPEN_CARD, OTHER_CARD]);
    press(drawn(), BUTTON);
    const answerFirst = answerOf(drawn());
    press(drawn(), BUTTON);

    answerFirst(KEPT);

    expect(uploadsOf(drawn()).map(({ props }) => props.scheduleId)).toEqual([
      OTHER_CARD.id,
    ]);
    expect(markup()).toContain("Foto kehadiran terunggah.");
  });
});
