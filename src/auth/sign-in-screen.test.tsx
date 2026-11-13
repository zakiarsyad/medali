import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SignInScreen } from "./sign-in-screen";

vi.mock("./sign-in-button", () => ({ SignInButton: () => null }));

const VALUE_WORDS = [
  "Mandiri",
  "Empatik",
  "Disiplin",
  "Adaptif",
  "Loyal",
  "berIntegritas",
];
const VALUE_ITEM = /<li>(.*?)<\/li>/g;
const MARKED_LETTER = /<b[^>]*>(.*?)<\/b>/;
const TAG = /<[^>]+>/g;

function valueItems(screen: string): string[] {
  return [...screen.matchAll(VALUE_ITEM)].map(([, item = ""]) => item);
}

describe("the sign-in page", () => {
  const screen = renderToStaticMarkup(<SignInScreen message={null} />);

  it("shows the MEDALI logo, the name, the campus and the tagline", () => {
    expect(screen).toContain('aria-label="Logo MEDALI"');
    expect(screen).toContain(">MEDALI</h1>");
    expect(screen).toContain("PKN STAN");
    expect(screen).toContain("Membangun Karakter, Meraih MEDALI");
  });

  it("shows the six value words, each read as one whole word", () => {
    const words = valueItems(screen).map((item) => item.replace(TAG, ""));

    expect(words).toEqual(VALUE_WORDS);
  });

  it("marks one letter of each value word, so together they spell MEDALI", () => {
    const letters = valueItems(screen).map(
      (item) => item.match(MARKED_LETTER)?.[1],
    );

    expect(letters.join("")).toBe("MEDALI");
  });

  it('links to "Kebijakan privasi"', () => {
    expect(screen).toMatch(/<a href="\/privasi"[^>]*>Kebijakan privasi<\/a>/);
  });
});
