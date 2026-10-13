import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MeetingCards } from "./meeting-cards";
import { MeetingNumbers } from "./meeting-numbers";
import type { MeetingCard } from "./meetings-overview";

const HELD: MeetingCard = {
  number: 1,
  stored: {
    id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7101",
    number: 1,
    heldOn: "2026-08-29",
    topic: "Orientasi kelompok dan kontrak belajar",
    version: 1,
    counts: { present: 27, excused: 1, sick: 0, absent: 2 },
  },
};

const CARDS: MeetingCard[] = [
  HELD,
  { number: 2, stored: null },
  { number: 3, stored: null },
  { number: 4, stored: null },
];

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7102";

/** The cards as text, one for each meeting. */
function cardsOf(cards: MeetingCard[], mayFillIn = false): string[] {
  const shown = renderToStaticMarkup(
    <MeetingCards cards={cards} groupId={GROUP_ID} mayFillIn={mayFillIn} />,
  );
  return shown.split("<article").slice(1);
}

describe("MeetingCards", () => {
  it("shows Pertemuan 1 to Pertemuan 4", () => {
    const cards = cardsOf(CARDS);

    expect(cards).toHaveLength(4);
    for (const [place, card] of cards.entries()) {
      expect(card).toContain(`Pertemuan ${place + 1}`);
    }
  });

  it("shows a saved meeting as Terlaksana, with its day, its topic and its counts", () => {
    const [card = ""] = cardsOf(CARDS);

    expect(card).toContain("Terlaksana");
    expect(card).not.toContain("Belum diisi");
    expect(card).toContain("29 Agu 2026");
    expect(card).toContain("Orientasi kelompok dan kontrak belajar");
    expect(card).toContain("Hadir 27 · izin 1 · sakit 0 · alpa 2");
  });

  it("shows a meeting without a list as Belum diisi", () => {
    const [, card = ""] = cardsOf(CARDS);

    expect(card).toContain("Belum diisi");
    expect(card).toContain("Daftar hadir belum diisi.");
    expect(card).not.toContain("Terlaksana");
  });

  it("offers Isi daftar hadir on a meeting without a list, to an account that may fill in for the group", () => {
    const [, card = ""] = cardsOf(CARDS, true);

    expect(card).toContain("Isi daftar hadir");
    expect(card).toContain(
      `href="/pengasuhan/hadir?kelompok=${GROUP_ID}&amp;pertemuan=2#daftar-hadir"`,
    );
  });

  it("offers Ubah daftar hadir on a saved meeting, to an account that may fill in for the group", () => {
    const [card = ""] = cardsOf(CARDS, true);

    expect(card).toContain("Ubah daftar hadir");
    expect(card).not.toContain("Isi daftar hadir");
    expect(card).toContain(
      `href="/pengasuhan/hadir?kelompok=${GROUP_ID}&amp;pertemuan=1#daftar-hadir"`,
    );
  });

  it("offers an account that only reads nothing to fill in or to change", () => {
    for (const card of cardsOf(CARDS, false)) {
      expect(card).not.toContain("Isi daftar hadir");
      expect(card).not.toContain("Ubah daftar hadir");
    }
  });

  it("offers an account that only reads Lihat daftar hadir on a saved meeting, and nothing on one without a list", () => {
    const [saved = "", empty = ""] = cardsOf(CARDS, false);

    expect(saved).toContain("Lihat daftar hadir");
    expect(saved).toContain(
      `href="/pengasuhan/hadir?kelompok=${GROUP_ID}&amp;pertemuan=1#daftar-hadir"`,
    );
    expect(empty).not.toContain("Lihat daftar hadir");
    expect(empty).not.toContain("href=");
  });

  it("offers an account that may fill in no Lihat daftar hadir: it changes the list instead", () => {
    for (const card of cardsOf(CARDS, true)) {
      expect(card).not.toContain("Lihat daftar hadir");
    }
  });
});

describe("MeetingNumbers", () => {
  function numbersOf(average: number | null): string {
    return renderToStaticMarkup(
      <MeetingNumbers
        held={2}
        periodTitle="Ganjil 2026/2027"
        members={28}
        groupCode="KP 24-D3PJK-01"
        average={average}
        mentor="Pengasuh Uji, M.Si."
      />,
    );
  }

  it("shows the four numbers of a group with the line under each", () => {
    const numbers = numbersOf(93);

    for (const words of [
      "Pertemuan terlaksana",
      "2 / 4",
      "semester Ganjil 2026/2027",
      "Anak asuh",
      "28",
      "KP 24-D3PJK-01",
      "Rerata kehadiran pengasuhan",
      "93%",
      "izin dan sakit tidak dihitung",
      "Pengasuh Uji, M.Si.",
    ]) {
      expect(numbers).toContain(words);
    }
  });

  it("shows a dash while there is no average", () => {
    expect(numbersOf(null)).toContain(">-<");
  });
});
