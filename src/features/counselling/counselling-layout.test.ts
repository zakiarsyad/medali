import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/features/counselling";
// Starts with a break, so the first rule is found like every other.
const STYLES = `\n${readFileSync(`${FOLDER}/counselling.module.css`, "utf8")}`;
const SHARED = `\n${readFileSync("src/ui/data-screen.module.css", "utf8")}`;

function read(name: string): string {
  return readFileSync(`${FOLDER}/${name}`, "utf8");
}

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(selector: string, styles = STYLES): string {
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

/** The rules that place the parts of Konseling, by the style file that holds them. */
const LAYOUT_RULES: [string, string[]][] = [
  [
    STYLES,
    [
      ".parts",
      ".warnBox",
      ".stack",
      ".status",
      ".found",
      ".found button",
      ".picked",
      ".full",
      ".tick",
      ".ticks",
      ".panelHead",
      ".cards",
      ".card",
      ".cardHead",
      ".badges",
      ".facts",
      ".steps",
      ".steps ol",
      ".subHeading",
      ".card > p",
      ".note",
      ".evaluation",
      ".history",
      ".history li",
      ".notes",
    ],
  ],
  [SHARED, [".actions", ".form"]],
];

describe("Konseling on a phone", () => {
  it("puts the notice and Persetujuan konseling one under the other, in one column", () => {
    expect(read("counselling-screen.tsx")).toContain(
      "<div className={styles.parts}>",
    );
    expect(ruleOf(".parts")).toContain("display: grid;");
    expect(ruleOf(".parts")).not.toContain("grid-template-columns");
  });

  it("folds the long words of a notice instead of widening the page", () => {
    expect(read("warn-box.tsx")).toContain("className={styles.warnBox}");
    expect(ruleOf(".warnBox")).toContain("overflow-wrap: anywhere;");
  });
});

describe("Persetujuan konseling of Konselor on a phone", () => {
  const PANEL = read("counsellor-consent-panel.tsx");
  const PICKER = read("consent-student-picker.tsx");

  it("lays its lines out one under the other", () => {
    expect(PANEL).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
    expect(ruleOf(".stack")).toContain("display: grid;");
    expect(ruleOf(".stack")).not.toContain("grid-template-columns");
  });

  it("folds a long name of a student found, and keeps each one inside the panel", () => {
    expect(PICKER).toContain("<div className={styles.found}>");
    expect(ruleOf(".found")).toContain("flex-direction: column;");
    expect(ruleOf(".found button")).toContain("max-width: 100%;");
    expect(ruleOf(".found button")).toContain("overflow-wrap: anywhere;");
  });

  it("folds the name of the student picked, and puts Ganti mahasiswa under it when there is no room", () => {
    expect(PICKER).toContain("<div className={styles.picked}>");
    expect(ruleOf(".picked")).toContain("flex-wrap: wrap;");
    expect(ruleOf(".picked")).toContain("overflow-wrap: anywhere;");
  });

  it("puts the second button under the first when both do not fit", () => {
    expect(PANEL).toContain("<div className={shared.actions}>");
    expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
  });

  it("puts the date and the Konselor of a status under its badge when there is no room", () => {
    expect(read("consent-badge.tsx")).toContain("className={styles.status}");
    expect(ruleOf(".status")).toContain("flex-wrap: wrap;");
  });
});

describe("Persetujuan konseling of the student on a phone", () => {
  const BOX = read("own-consent-box.tsx");

  it("lays its lines out one under the other", () => {
    expect(BOX).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
  });

  it("folds the text of a waiting request, and puts Tolak under Setujui when both do not fit", () => {
    expect(BOX).toContain("<div className={styles.warnBox}>");
    expect(BOX).toContain("<div className={shared.actions}>");
    expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
  });
});

describe("Daftar konseling sukarela and Jadwal konseling saya on a phone", () => {
  const FORM = read("register-form.tsx");
  const LIST = read("own-schedule-list.tsx");
  const CARD = read("own-schedule-card.tsx");

  it("put the fields in as many columns as fit, one on a phone", () => {
    expect(FORM).toContain("className={shared.form}");
    expect(ruleOf(".form", SHARED)).toContain(
      "min(var(--card-min-width), 100%)",
    );
  });

  it("fold the consent text beside its tick", () => {
    expect(FORM).toContain("styles.tick");
    expect(ruleOf(".tick")).toContain("overflow-wrap: anywhere;");
  });

  it("lay the cards out one under the other, folding long words", () => {
    expect(LIST).toContain("<ul className={styles.cards}>");
    expect(ruleOf(".cards")).toContain("display: grid;");
    expect(ruleOf(".cards")).not.toContain("grid-template-columns");
    expect(CARD).toContain("className={styles.card}");
    expect(ruleOf(".card")).toContain("overflow-wrap: anywhere;");
  });

  it("put the status under the title, and the facts one under the other, when there is no room", () => {
    expect(CARD).toContain("className={styles.cardHead}");
    expect(ruleOf(".cardHead")).toContain("flex-wrap: wrap;");
    expect(CARD).toContain("className={styles.facts}");
    expect(ruleOf(".facts")).toContain("min(100%, var(--card-min-width))");
  });
});

describe("Jadwal konseling of Konselor on a phone", () => {
  const PANEL = read("schedule-panel.tsx");
  const CARD = read("counsellor-schedule-card.tsx");

  it("lays the numbers, the filter and the cards out one under the other", () => {
    expect(PANEL).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
    expect(PANEL).toContain("<ul className={styles.cards}>");
  });

  it("puts the status under the name, and folds the facts and the story", () => {
    expect(CARD).toContain("className={styles.card}");
    expect(CARD).toContain("className={styles.cardHead}");
    expect(CARD).toContain("className={styles.facts}");
  });
});

describe("the buttons and forms of a request card on a phone", () => {
  it.each(["counsellor-schedule-item.tsx", "own-schedule-item.tsx"])(
    "%s puts its buttons under each other when they do not fit",
    (name) => {
      expect(read(name)).toContain("<div className={shared.actions}>");
      expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
    },
  );

  it.each(["schedule-time-form.tsx", "own-schedule-item.tsx"])(
    "%s puts its form fields in one column",
    (name) => {
      expect(read(name)).toContain("className={shared.form}");
    },
  );
});

describe("Catat sesi and Riwayat sesi on a phone", () => {
  const FORM = read("session-form.tsx");
  const CHANGE = read("session-history-list.tsx");
  const FIELDS = read("session-fields.tsx");

  it.each([
    ["session-form.tsx", FORM],
    ["session-history-list.tsx", CHANGE],
  ])(
    "%s puts its fields in one column, and its buttons under each other",
    (_, source) => {
      expect(source).toContain("className={shared.form}");
      expect(source).toContain("shared.actions");
      expect(ruleOf(".form", SHARED)).toContain(
        "min(var(--card-min-width), 100%)",
      );
    },
  );

  it("puts the notes across the whole width of the form", () => {
    expect(FIELDS).toMatch(/shared\.field\} \$\{styles\.full\}/);
  });

  it("lays the sessions out one under the other, folding long notes", () => {
    expect(CHANGE).toContain("<ul className={styles.cards}>");
    expect(CHANGE).toContain("className={styles.card}");
    expect(CHANGE).toContain("className={styles.notes}");
    expect(ruleOf(".notes")).toContain("overflow-wrap: anywhere;");
  });
});

describe("Publikasi data kesehatan mental on a phone", () => {
  const PANEL = read("counsellor-sharing-panel.tsx");
  const FORM = read("sharing-form.tsx");
  const FACTS = read("sharing-facts.tsx");

  it("lays its lines out one under the other", () => {
    expect(PANEL).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
  });

  it("puts its fields in one column and its ticks one under the other, each folding its text", () => {
    expect(FORM).toContain("className={shared.form}");
    expect(FORM).toMatch(
      /shared\.roles\} \$\{styles\.ticks\} \$\{styles\.full\}/,
    );
    expect(FORM).toContain("className={styles.tick}");
    expect(ruleOf(".ticks")).toContain("flex-direction: column;");
    expect(ruleOf(".tick")).toContain("overflow-wrap: anywhere;");
  });

  it("puts a second button under the first when both do not fit", () => {
    expect(read("sharing-moves.tsx")).toContain("className={shared.actions}");
    expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
  });

  it("folds who it is for, what it gives and the summary inside its box", () => {
    expect(FACTS).toContain("className={styles.card}");
    expect(ruleOf(".card")).toContain("overflow-wrap: anywhere;");
  });
});

describe("the student's sharing box on a phone", () => {
  const BOX = read("own-sharing-box.tsx");

  it("folds a waiting request and puts Tolak under Setujui berbagi data when both do not fit", () => {
    expect(BOX).toContain("className={styles.warnBox}");
    expect(BOX).toContain("className={shared.actions}");
    expect(ruleOf(".warnBox")).toContain("overflow-wrap: anywhere;");
    expect(ruleOf(".actions", SHARED)).toContain("flex-wrap: wrap;");
  });

  it("folds what is shared with whom inside its box", () => {
    expect(BOX).toMatch(
      /className=\{`\$\{styles\.card\} \$\{styles\.stack\}`\}/,
    );
    expect(ruleOf(".card")).toContain("overflow-wrap: anywhere;");
  });
});

describe("Data yang dipublikasikan untuk Anda on a phone", () => {
  it("lays its lines out one under the other", () => {
    expect(read("shared-list.tsx")).toMatch(
      /className=\{`\$\{shared\.panel\} \$\{styles\.stack\}`\}/,
    );
  });

  it("turns each student into a card that folds its words, with no sideways scroll", () => {
    expect(read("shared-table.tsx")).toMatch(
      /className=\{`\$\{shared\.table\} \$\{shared\.stacked\}`\}/,
    );
    expect(ruleOf(".stacked tbody tr", SHARED)).toContain(
      "grid-template-columns: minmax(0, 1fr);",
    );
    expect(ruleOf(".stacked td", SHARED)).toContain(
      "overflow-wrap: break-word;",
    );
  });
});

describe("the style files of Konseling", () => {
  it("force no width wider than a phone", () => {
    for (const [styles, selectors] of LAYOUT_RULES) {
      for (const selector of selectors) {
        const rule = ruleOf(selector, styles);
        expect(rule, selector).not.toBe("");
        expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
        expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
        expect(rule, selector).not.toContain("nowrap");
      }
    }
  });
});

describe("an assignment card of Konselor on a phone", () => {
  it("puts the Jenis and the status under each other when there is no room, and Dasar across the card", () => {
    const CARD = read("counsellor-schedule-card.tsx");
    expect(CARD).toContain("<div className={styles.badges}>");
    expect(ruleOf(".badges")).toContain("flex-wrap: wrap;");
    expect(CARD).toMatch(/<Fact title="Dasar" isWide>/);
    expect(CARD).toMatch(/<Fact title="Pesan pengirim" isWide>/);
  });
});

describe("an assignment card of the student on a phone", () => {
  it("puts the wajib mark under the title when there is no room", () => {
    expect(read("own-schedule-card.tsx")).toContain(
      "<div className={styles.badges}>",
    );
    expect(ruleOf(".badges")).toContain("flex-wrap: wrap;");
  });
});
