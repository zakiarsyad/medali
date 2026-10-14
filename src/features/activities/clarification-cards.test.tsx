import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { answersAfter } from "./card-decisions";
import type { ClarificationCard } from "./clarification-card";
import {
  type ClarificationAnswers,
  ClarificationCardsView,
  NO_CLARIFICATION_ANSWERS,
} from "./clarification-cards-view";
import { ClarificationDecide } from "./clarification-decide";
import { ClarificationDecideView } from "./clarification-decide-view";
import type {
  ClarificationAnswer,
  DecisionKind,
} from "./clarification-decision";
import { TEST_CLARIFICATION } from "./test-clarifications";
import { type Drawn, draw, isPressable, offered, press } from "./test-press";

vi.mock("./clarification-actions", () => ({
  decideClarificationAction: vi.fn(),
}));

const EMPTY_WORDS = "Tidak ada klarifikasi pada filter ini.";
/** Sent an hour before the first card: it stands under it, the newest being first. */
const OLDER: ClarificationCard = {
  ...TEST_CLARIFICATION,
  id: "00000000-0000-4000-8000-0000000000d2",
  sentAt: "2026-10-13T04:00:00.000Z",
  name: "Mahasiswa Uji Klarifikasi Dua",
  file: { name: "foto-surat.jpg", isPdf: false, facts: "Gambar · 3 KB" },
};
const ACCEPTED: ClarificationAnswer = {
  state: {
    error: null,
    done: "Klarifikasi diterima; status kehadiran diperbarui.",
  },
  card: {
    ...TEST_CLARIFICATION,
    status: "accepted",
    decision: {
      result: "Diterima sebagai hadir",
      by: "(Penilai Uji, 14 Okt 2026, 09.00)",
    },
  },
};

/**
 * The cards as the screen part keeps them: drawn from the answers that
 * every decision adds by the real rule. What a card offers to decide is
 * left undrawn here; its own checks press its buttons.
 */
function board() {
  let answers: ClarificationAnswers = NO_CLARIFICATION_ANSWERS;
  const opened: string[] = [];
  function view(cards: ClarificationCard[]) {
    return (
      <ClarificationCardsView
        cards={cards}
        answers={answers}
        emptyWords={EMPTY_WORDS}
        onOpenFile={(card) => opened.push(card.id)}
        onAnswer={(cardId, answer) => {
          answers = answersAfter(answers, { cardId, answer });
        }}
      />
    );
  }
  return {
    drawn: (cards: ClarificationCard[]) =>
      draw(view(cards), [ClarificationDecide]),
    markup: (cards: ClarificationCard[]) => renderToStaticMarkup(view(cards)),
    /** The cards whose file name was pressed, in order. */
    opened,
  };
}

function decidesOf(drawn: Drawn) {
  return drawn.filter(({ type }) => type === ClarificationDecide);
}

/** Tells the cards what a press of a decision on a card answered. */
function answer(drawn: Drawn, cardId: string, sent: ClarificationAnswer) {
  const decide = decidesOf(drawn).find(({ props }) => props.cardId === cardId);
  if (!decide) throw new Error(`The card ${cardId} offers no decision.`);
  (decide.props.onAnswer as (sent: ClarificationAnswer) => void)(sent);
}

describe("the clarification cards", () => {
  it("offer the Catatan and the three decisions on a card that waits", () => {
    const cards = board().markup([TEST_CLARIFICATION]);

    expect(cards).toContain('placeholder="Catatan (wajib bila ditolak)"');
    expect(cards).toContain('maxLength="200"');
    expect(cards).toContain(">Terima sebagai hadir</button>");
    expect(cards).toContain(">Terima sebagai dispensasi</button>");
    expect(cards).toContain(">Tolak</button>");
  });

  it.each(["accepted", "rejected"] as const)(
    "offer nothing to decide on a card that is %s: a decision is not changed",
    (status) => {
      const decided = { ...TEST_CLARIFICATION, status };

      const drawn = board().drawn([decided, OLDER]);

      expect(decidesOf(drawn).map(({ props }) => props.cardId)).toEqual([
        OLDER.id,
      ]);
    },
  );

  it("open the file of the card whose file name is pressed", () => {
    const cards = board();
    const drawn = cards.drawn([TEST_CLARIFICATION, OLDER]);

    press(drawn, "foto-surat.jpg");
    press(drawn, "surat-keterangan.pdf");

    expect(cards.opened).toEqual([OLDER.id, TEST_CLARIFICATION.id]);
  });

  it("say so when there is no card", () => {
    expect(board().markup([])).toContain(`>${EMPTY_WORDS}</p>`);
  });
});

describe("a decision on a clarification card", () => {
  it("shows Diterima with the decision, who decided and when, and the message, on the card in its place, also once the list of waiting ones holds it no more", () => {
    const cards = board();
    answer(
      cards.drawn([TEST_CLARIFICATION, OLDER]),
      TEST_CLARIFICATION.id,
      ACCEPTED,
    );

    const drawn = cards.drawn([OLDER]);
    const markup = cards.markup([OLDER]);

    expect(markup).toMatch(/<span[^>]*>Diterima<\/span>/);
    expect(markup).toContain("<dt>Keputusan</dt><dd>Diterima sebagai hadir");
    expect(markup).toContain("(Penilai Uji, 14 Okt 2026, 09.00)");
    expect(markup).toContain(
      'role="status">Klarifikasi diterima; status kehadiran diperbarui.</p>',
    );
    expect(decidesOf(drawn).map(({ props }) => props.cardId)).toEqual([
      OLDER.id,
    ]);
    expect(markup.indexOf("Mahasiswa Uji Klarifikasi<")).toBeLessThan(
      markup.indexOf("Mahasiswa Uji Klarifikasi Dua<"),
    );
  });

  it("shows the card as someone else decided it, with the message that it was decided already", () => {
    const cards = board();
    answer(cards.drawn([TEST_CLARIFICATION]), TEST_CLARIFICATION.id, {
      state: {
        error: "Klarifikasi ini sudah diputuskan oleh petugas lain.",
        done: null,
      },
      card: {
        ...TEST_CLARIFICATION,
        status: "rejected",
        decision: { result: "Ditolak: Uji.", by: "(Penilai Lain, -)" },
      },
    });

    const markup = cards.markup([]);

    expect(markup).toContain(
      'role="alert">Klarifikasi ini sudah diputuskan oleh petugas lain.</p>',
    );
    expect(markup).toMatch(/<span[^>]*>Ditolak<\/span>/);
    expect(decidesOf(cards.drawn([]))).toEqual([]);
  });

  it("leaves a card that waits as it is when the decision is refused, with the reason under it, to be decided again", () => {
    const cards = board();
    answer(cards.drawn([TEST_CLARIFICATION]), TEST_CLARIFICATION.id, {
      state: {
        error: "Tulis alasan penolakan di kolom catatan.",
        done: null,
      },
      card: null,
    });

    const markup = cards.markup([TEST_CLARIFICATION]);

    expect(markup).toContain(
      'role="alert">Tulis alasan penolakan di kolom catatan.</p>',
    );
    expect(markup).toMatch(/<span[^>]*>Diajukan<\/span>/);
    expect(decidesOf(cards.drawn([TEST_CLARIFICATION]))).toHaveLength(1);
  });

  it("keeps only the newest answer of a card", () => {
    const cards = board();
    answer(cards.drawn([TEST_CLARIFICATION]), TEST_CLARIFICATION.id, {
      state: { error: "Tulis alasan penolakan di kolom catatan.", done: null },
      card: null,
    });
    answer(cards.drawn([TEST_CLARIFICATION]), TEST_CLARIFICATION.id, ACCEPTED);

    const markup = cards.markup([]);

    expect(markup).not.toContain("Tulis alasan penolakan");
    expect(markup).toContain("Klarifikasi diterima; status kehadiran");
  });
});

describe("ClarificationDecideView", () => {
  function drawnWith(busy: boolean) {
    const told: string[] = [];
    const drawn = draw(
      <ClarificationDecideView
        name="Mahasiswa Uji"
        note="Uji."
        busy={busy}
        onNote={(note) => told.push(`note ${note}`)}
        onDecide={(kind: DecisionKind) => told.push(kind)}
      />,
    );
    return { drawn, told };
  }

  it("offers the three decisions in the order of the prototype, each telling its own", () => {
    const { drawn, told } = drawnWith(false);

    for (const words of offered(drawn)) press(drawn, words);

    expect(offered(drawn)).toEqual([
      "Terima sebagai hadir",
      "Terima sebagai dispensasi",
      "Tolak",
    ]);
    expect(told).toEqual(["present", "dispensation", "reject"]);
  });

  it("names the student in the label of the Catatan, and tells what is typed", () => {
    const { drawn, told } = drawnWith(false);
    const field = drawn.find(({ type }) => type === "input");
    if (!field) throw new Error("No Catatan is shown.");

    (field.props.onChange as (event: unknown) => void)({
      target: { value: "Lampiran" },
    });

    expect(field.props["aria-label"]).toBe(
      "Catatan untuk klarifikasi Mahasiswa Uji",
    );
    expect(field.props.value).toBe("Uji.");
    expect(told).toEqual(["note Lampiran"]);
  });

  it("switches everything off while a decision is on its way, so a second press sends nothing", () => {
    const { drawn, told } = drawnWith(true);

    for (const words of offered(drawn)) {
      expect(isPressable(drawn, words)).toBe(false);
      press(drawn, words);
    }

    expect(drawn.find(({ type }) => type === "input")?.props.disabled).toBe(
      true,
    );
    expect(told).toEqual([]);
  });
});
