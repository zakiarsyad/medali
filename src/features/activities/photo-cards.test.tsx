import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CardDecision } from "./card-decision";
import { CardDecisionView } from "./card-decision-view";
import { type AnsweredCard, answersAfter, NO_ANSWERS } from "./card-decisions";
import { PhotoCards } from "./photo-cards";
import { PhotoCardsView } from "./photo-cards-view";
import { type Drawn, draw, isPressable, offered, press } from "./test-press";
import { TEST_CARD } from "./test-verification";
import type { DecisionAnswer, VerificationCard } from "./verification-card";

vi.mock("./verification-actions", () => ({
  validateAttendanceAction: vi.fn(),
  rejectAttendanceAction: vi.fn(),
}));

const EMPTY_WORDS = "Tidak ada swafoto yang menunggu verifikasi.";
const OTHER_CARD = {
  ...TEST_CARD,
  id: "00000000-0000-4000-8000-0000000000c2",
  sentAt: "2026-10-13T06:00:00.000Z",
  name: "Mahasiswa Uji Kartu Dua",
};
const VALIDATED: DecisionAnswer = {
  state: { error: null, done: "Presensi divalidasi." },
  card: { ...TEST_CARD, status: "valid", decidedBy: "Pegawai Uji" },
};

/**
 * The cards as the screen part keeps them: drawn from the answers that
 * every decision adds by the real rule. What a card offers to decide is
 * left undrawn here; its own checks press its buttons.
 */
function board() {
  let answers = NO_ANSWERS;
  function tell(event: AnsweredCard): void {
    answers = answersAfter(answers, event);
  }
  function view(cards: VerificationCard[]) {
    return (
      <PhotoCardsView
        cards={cards}
        answers={answers}
        emptyWords={EMPTY_WORDS}
        onAnswer={(cardId, answer) => tell({ cardId, answer })}
      />
    );
  }
  return {
    drawn: (cards: VerificationCard[]) => draw(view(cards), [CardDecision]),
    markup: (cards: VerificationCard[]) => renderToStaticMarkup(view(cards)),
  };
}

function decisionsOf(drawn: Drawn) {
  return drawn.filter(({ type }) => type === CardDecision);
}

/** Tells the cards what the server answered to the decision on a card. */
function answer(drawn: Drawn, cardId: string, sent: DecisionAnswer): void {
  const decision = decisionsOf(drawn).find(
    ({ props }) => props.cardId === cardId,
  );
  if (!decision) throw new Error(`The card ${cardId} offers no decision.`);
  (decision.props.onAnswer as (sent: DecisionAnswer) => void)(sent);
}

describe("PhotoCards", () => {
  it('offers "Validasi" and "Tolak" with the five reasons on a card that waits', () => {
    const cards = renderToStaticMarkup(
      <PhotoCards cards={[TEST_CARD]} emptyWords={EMPTY_WORDS} />,
    );

    expect(cards).toContain(">Validasi</button>");
    expect(cards).toContain(">Tolak</button>");
    for (const reason of [
      "Wajah tidak terlihat jelas",
      "Foto bukan dari kegiatan ini",
      "Tidak terlihat di lokasi kegiatan",
      "Foto tidak sesuai waktu kegiatan",
      "Lainnya",
    ]) {
      expect(cards).toContain(`<option value="${reason}">${reason}</option>`);
    }
  });

  it.each(["valid", "rejected", "dispensation"] as const)(
    "offers nothing to decide on a card that is %s: a decision is not changed",
    (status) => {
      const decided = { ...TEST_CARD, status, decidedBy: "Pegawai Uji" };

      const drawn = board().drawn([decided, OTHER_CARD]);

      expect(decisionsOf(drawn).map(({ props }) => props.cardId)).toEqual([
        OTHER_CARD.id,
      ]);
    },
  );

  it("says so when there is no card", () => {
    expect(board().markup([])).toContain(`>${EMPTY_WORDS}</p>`);
  });
});

describe("a decision on a card", () => {
  it('shows "Hadir" with the name of who validated and "Presensi divalidasi." on the card, also once the list of waiting photos holds it no more', () => {
    const cards = board();
    answer(cards.drawn([TEST_CARD, OTHER_CARD]), TEST_CARD.id, VALIDATED);

    const drawn = cards.drawn([OTHER_CARD]);
    const markup = cards.markup([OTHER_CARD]);

    expect(markup).toMatch(/<span[^>]*>Hadir<\/span>/);
    expect(markup).toContain(">Pegawai Uji</span>");
    expect(markup).toContain('role="status">Presensi divalidasi.</p>');
    expect(decisionsOf(drawn).map(({ props }) => props.cardId)).toEqual([
      OTHER_CARD.id,
    ]);
    expect(markup.indexOf("Mahasiswa Uji Kartu<")).toBeLessThan(
      markup.indexOf("Mahasiswa Uji Kartu Dua<"),
    );
  });

  it('shows "Ditolak" with the reason after a rejection', () => {
    const cards = board();
    answer(cards.drawn([TEST_CARD]), TEST_CARD.id, {
      state: {
        error: null,
        done: "Presensi ditolak: Foto bukan dari kegiatan ini.",
      },
      card: {
        ...TEST_CARD,
        status: "rejected",
        note: "Foto bukan dari kegiatan ini",
        decidedBy: "Pegawai Uji",
      },
    });

    const markup = cards.markup([]);

    expect(markup).toMatch(/<span[^>]*>Ditolak<\/span>/);
    expect(markup).toContain(">Foto bukan dari kegiatan ini · Pegawai Uji<");
    expect(markup).toContain(
      'role="status">Presensi ditolak: Foto bukan dari kegiatan ini.</p>',
    );
  });

  it("shows the card as someone else decided it, with the message that it was decided already", () => {
    const cards = board();
    answer(cards.drawn([TEST_CARD]), TEST_CARD.id, {
      state: {
        error: "Presensi ini sudah diputuskan oleh petugas lain.",
        done: null,
      },
      card: { ...TEST_CARD, status: "rejected", decidedBy: "Pegawai Lain" },
    });

    const markup = cards.markup([]);

    expect(markup).toContain(
      'role="alert">Presensi ini sudah diputuskan oleh petugas lain.</p>',
    );
    expect(markup).toMatch(/<span[^>]*>Ditolak<\/span>/);
    expect(decisionsOf(cards.drawn([]))).toEqual([]);
  });

  it("leaves a card that waits as it is when the decision is refused, with the reason under it", () => {
    const cards = board();
    answer(cards.drawn([TEST_CARD]), TEST_CARD.id, {
      state: { error: "Pilih alasan penolakan.", done: null },
      card: null,
    });

    expect(cards.markup([TEST_CARD])).toContain(
      'role="alert">Pilih alasan penolakan.</p>',
    );
    expect(decisionsOf(cards.drawn([TEST_CARD]))).toHaveLength(1);
  });
});

describe("CardDecisionView", () => {
  function view(more: { reason?: string; busy?: boolean } = {}) {
    const pressed: string[] = [];
    const drawn = draw(
      <CardDecisionView
        name="Mahasiswa Uji Kartu"
        reason={more.reason ?? ""}
        note=""
        busy={more.busy ?? false}
        onReason={(reason) => pressed.push(`reason ${reason}`)}
        onNote={(note) => pressed.push(`note ${note}`)}
        onValidate={() => pressed.push("validate")}
        onReject={() => pressed.push("reject")}
      />,
    );
    return { drawn, pressed };
  }

  function fields(drawn: Drawn, type: string) {
    return drawn.filter((element) => element.type === type);
  }

  it('offers "Validasi" and "Tolak", and tells each press apart', () => {
    const { drawn, pressed } = view();

    expect(offered(drawn)).toEqual(["Validasi", "Tolak"]);
    press(drawn, "Validasi");
    press(drawn, "Tolak");

    expect(pressed).toEqual(["validate", "reject"]);
  });

  it("rejects nothing when a reason is chosen: only Tolak does", () => {
    const { drawn, pressed } = view();
    const [reasons] = fields(drawn, "select");
    const choose = reasons?.props.onChange as (event: unknown) => void;

    choose({ target: { value: "Wajah tidak terlihat jelas" } });

    expect(pressed).toEqual(["reason Wajah tidak terlihat jelas"]);
  });

  it("asks for a short note only when the reason is Lainnya", () => {
    expect(fields(view().drawn, "input")).toEqual([]);
    expect(
      fields(view({ reason: "Wajah tidak terlihat jelas" }).drawn, "input"),
    ).toEqual([]);

    const [note] = fields(view({ reason: "Lainnya" }).drawn, "input");

    expect(note?.props).toMatchObject({
      "aria-label": "Catatan alasan Lainnya untuk Mahasiswa Uji Kartu",
      maxLength: 200,
    });
  });

  it("switches every press off while a decision is on its way", () => {
    const { drawn, pressed } = view({ busy: true });

    expect(isPressable(drawn, "Validasi")).toBe(false);
    expect(isPressable(drawn, "Tolak")).toBe(false);
    press(drawn, "Validasi");
    press(drawn, "Tolak");

    expect(pressed).toEqual([]);
  });
});
