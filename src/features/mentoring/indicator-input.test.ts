import { describe, expect, it } from "vitest";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import {
  indicatorFaults,
  NAME_EMPTY,
  NAME_TOO_LONG,
  NAMES_EQUAL,
  parseIndicators,
  SENTENCE_EMPTY,
  SENTENCE_TOO_LONG,
  sentIndicatorsOf,
} from "./indicator-input";

const STARTING = STARTING_INDICATORS.map((indicator) => ({ ...indicator }));

function withFirst(name: string, sentence = STARTING[0]?.sentence ?? "") {
  return [{ name, sentence }, ...STARTING.slice(1)];
}

describe("indicatorFaults", () => {
  it("finds nothing wrong with the starting indicators", () => {
    expect(indicatorFaults(STARTING)).toEqual(STARTING.map(() => ({})));
  });

  it("says a name may not be empty, not even of blanks", () => {
    expect(indicatorFaults(withFirst("   "))[0]).toEqual({ name: NAME_EMPTY });
    expect(NAME_EMPTY).toBe("Nama indikator wajib diisi.");
  });

  it("says two equal names may not be, on both of them, whatever their case or the blanks around them", () => {
    const faults = indicatorFaults(withFirst(" empati "));

    expect(faults[0]).toEqual({ name: NAMES_EQUAL });
    expect(faults[1]).toEqual({ name: NAMES_EQUAL });
    expect(faults[2]).toEqual({});
    expect(NAMES_EQUAL).toBe("Nama indikator tidak boleh sama.");
  });

  it("takes a sentence of 200 characters, and says one of 201 is too long", () => {
    const at200 = indicatorFaults(withFirst("Mandiri", "a".repeat(200)));
    const at201 = indicatorFaults(withFirst("Mandiri", "a".repeat(201)));

    expect(at200[0]).toEqual({});
    expect(at201[0]).toEqual({ sentence: SENTENCE_TOO_LONG });
    expect(SENTENCE_TOO_LONG).toBe(
      "Kalimat indikator paling banyak 200 karakter.",
    );
  });

  it("says a sentence may not be empty, and a name may not be over 50 characters", () => {
    const faults = indicatorFaults(withFirst("a".repeat(51), " "));

    expect(faults[0]).toEqual({
      name: NAME_TOO_LONG,
      sentence: SENTENCE_EMPTY,
    });
  });
});

describe("parseIndicators", () => {
  it("gives the six indicators, without the blanks around them", () => {
    const parsed = parseIndicators(withFirst("  Kemandirian  ", " Rapi. "));

    expect(parsed).toEqual({
      ok: true,
      value: [{ name: "Kemandirian", sentence: "Rapi." }, ...STARTING.slice(1)],
    });
  });

  it.each([
    ["an empty name", withFirst("")],
    ["two equal names", withFirst("Empati")],
    ["a sentence over 200 characters", withFirst("Mandiri", "a".repeat(201))],
    ["five indicators", STARTING.slice(0, 5)],
    ["seven indicators", [...STARTING, ...STARTING.slice(0, 1)]],
  ])("saves nothing with %s", (_, sent) => {
    expect(parseIndicators(sent).ok).toBe(false);
  });
});

describe("sentIndicatorsOf", () => {
  it("reads the name and the sentence of each of the six from the form", () => {
    const form = new FormData();
    for (const [place, indicator] of STARTING.entries()) {
      form.set(`indicator.${place}.name`, indicator.name);
      form.set(`indicator.${place}.sentence`, indicator.sentence);
    }

    expect(sentIndicatorsOf(form)).toEqual(STARTING);
  });

  it("reads a missing field as empty", () => {
    expect(sentIndicatorsOf(new FormData())[0]).toEqual({
      name: "",
      sentence: "",
    });
  });
});
