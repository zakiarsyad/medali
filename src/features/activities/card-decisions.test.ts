import { describe, expect, it } from "vitest";
import {
  answersAfter,
  answersAfterMany,
  answerTo,
  NO_ANSWERS,
  shownCards,
} from "./card-decisions";
import { TEST_CARD } from "./test-verification";
import type { DecisionAnswer, VerificationCard } from "./verification-card";

function cardAt(minute: number, more: Partial<VerificationCard> = {}) {
  return {
    ...TEST_CARD,
    id: `card-${minute}`,
    sentAt: `2026-10-13T05:${String(minute).padStart(2, "0")}:00.000Z`,
    ...more,
  };
}

function validated(card: VerificationCard): DecisionAnswer {
  return {
    state: { error: null, done: "Presensi divalidasi." },
    card: { ...card, status: "valid", decidedBy: "Pegawai Uji" },
  };
}

describe("shownCards", () => {
  it("shows the cards of the list as they are while nothing was decided", () => {
    const listed = [cardAt(1), cardAt(2)];

    expect(shownCards(listed, NO_ANSWERS)).toEqual(listed);
  });

  it("keeps a card that was decided here and has left the list, in its place, as the answer gave it", () => {
    const [first, second, third] = [cardAt(1), cardAt(2), cardAt(3)];
    const answers = answersAfter(NO_ANSWERS, {
      cardId: second.id,
      answer: validated(second),
    });

    // The list of waiting photos, read again: the validated one is gone
    // and the next one of the following page has moved up.
    const shown = shownCards([first, third, cardAt(4)], answers);

    expect(shown.map((card) => card.id)).toEqual([
      "card-1",
      "card-2",
      "card-3",
      "card-4",
    ]);
    expect(shown[1]).toMatchObject({
      status: "valid",
      decidedBy: "Pegawai Uji",
    });
  });

  it("shows a card the list still holds as the list has it, and only once", () => {
    const card = cardAt(1);
    const answers = answersAfter(NO_ANSWERS, {
      cardId: card.id,
      answer: validated(card),
    });
    const listedNow = { ...card, status: "rejected" as const };

    expect(shownCards([listedNow], answers)).toEqual([listedNow]);
  });

  it("adds no card for an answer without one, as a refusal", () => {
    const answers = answersAfter(NO_ANSWERS, {
      cardId: "card-9",
      answer: {
        state: { error: "Pilih alasan penolakan.", done: null },
        card: null,
      },
    });

    expect(shownCards([cardAt(1)], answers)).toHaveLength(1);
  });

  it("puts two cards sent at the same moment in one order", () => {
    const one = cardAt(1, { id: "card-a" });
    const other = cardAt(1, { id: "card-b" });
    const answers = answersAfter(NO_ANSWERS, {
      cardId: one.id,
      answer: validated(one),
    });

    const shown = shownCards([other], answers);

    expect(shown.map((card) => card.id)).toEqual(["card-a", "card-b"]);
  });
});

describe("answersAfter", () => {
  it("replaces the last answer of a card by its newest, and keeps those of other cards", () => {
    const refused = {
      state: { error: "Pilih alasan penolakan.", done: null },
      card: null,
    };
    const first = answersAfter(NO_ANSWERS, { cardId: "a", answer: refused });
    const other = answersAfter(first, { cardId: "b", answer: refused });

    const after = answersAfter(other, {
      cardId: "a",
      answer: validated(cardAt(1)),
    });

    expect(after.a?.state.done).toBe("Presensi divalidasi.");
    expect(after.b).toBe(refused);
  });
});

describe("answersAfterMany", () => {
  it("keeps each card validated at once as it stands now, without words of its own, in place of its last answer", () => {
    const refused = {
      state: { error: "Pilih alasan penolakan.", done: null },
      card: null,
    };
    const before = answersAfter(NO_ANSWERS, {
      cardId: "card-1",
      answer: refused,
    });
    const one = { ...cardAt(1), status: "valid" as const };
    const two = { ...cardAt(2), status: "rejected" as const };

    const after = answersAfterMany(before, [one, two]);

    expect(after).toEqual({
      "card-1": { state: { error: null, done: null }, card: one },
      "card-2": { state: { error: null, done: null }, card: two },
    });
    expect(shownCards([], after)).toEqual([one, two]);
  });
});

describe("answerTo", () => {
  it("gives what the server answered", async () => {
    const answer = validated(cardAt(1));

    expect(
      await answerTo(
        async () => answer,
        () => {},
      ),
    ).toBe(answer);
  });

  it("says to try again when the decision did not arrive, after what is no failure was thrown again", async () => {
    const lost = new Error("offline");
    const rethrown: unknown[] = [];

    const answer = await answerTo(
      async () => {
        throw lost;
      },
      (error) => rethrown.push(error),
    );

    expect(rethrown).toEqual([lost]);
    expect(answer).toEqual({
      state: {
        error:
          "Putusan tidak terkirim. Periksa koneksi internet, lalu coba lagi.",
        done: null,
      },
      card: null,
    });
  });
});
