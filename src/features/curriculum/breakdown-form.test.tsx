import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/ui/form-message";
import { saveStageBreakdownAction } from "./actions";
import { BreakdownForm } from "./breakdown-form";
import { mainIndicators } from "./main-indicators";
import type { ValueBreakdown } from "./stage-breakdown";

type Save = (before: FormState, form: FormData) => Promise<FormState>;

/*
 * The checks run without a browser, so Simpan is pressed by calling the
 * form and its own handler.
 * What it keeps starts as given, the answer it shows is set here, and a
 * press of Simpan runs its save at once.
 */
const shown = vi.hoisted(() => ({
  answer: { error: null, done: null } as FormState,
  sent: [] as Promise<FormState>[],
}));

vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState: (start: unknown) => [
    typeof start === "function" ? start() : start,
    () => {},
  ],
  useActionState: (save: Save, start: FormState) => {
    const send = (form: FormData) => {
      shown.sent.push(save(start, form));
    };
    return [shown.answer, send, false];
  },
  startTransition: (run: () => void) => run(),
}));

vi.mock("./actions", () => ({ saveStageBreakdownAction: vi.fn() }));

const REFUSED: FormState = {
  error:
    "Penjabaran ini baru saja diubah orang lain, jadi perubahan Anda tidak disimpan. Muat ulang untuk melihat versi terbaru.",
  done: null,
};

/** The box as the person left it in the form before pressing Simpan. */
const TYPED: ValueBreakdown = {
  key: "M",
  name: "Mandiri",
  text: "Teks yang diketik.",
  activities: ["Kegiatan diketik"],
  indicatorCodes: ["M1", "M3"],
  version: "2026-10-21T03:00:00.000Z",
};

const INDICATORS = mainIndicators(new Map())[0]?.indicators ?? [];

function formProps(onSaved: (message: string) => void) {
  return {
    tahapNo: 2,
    value: TYPED,
    indicators: INDICATORS,
    onSaved,
    onCancel: () => {},
  };
}

/**
 * Presses Simpan: the form is sent as its own handler sends it. Gives
 * whether the browser was kept from sending the form itself.
 */
async function pressSave(onSaved: (message: string) => void): Promise<boolean> {
  let isKeptFromBrowser = false;
  const form = BreakdownForm(formProps(onSaved));
  const props = form.props as { onSubmit: (event: unknown) => void };
  props.onSubmit({
    preventDefault: () => {
      isKeptFromBrowser = true;
    },
    currentTarget: undefined,
  });
  await Promise.all(shown.sent);
  return isKeptFromBrowser;
}

/** The codes of the indicator boxes the drawn form shows ticked. */
function tickedIndicators(html: string): string[] {
  const boxes = html.match(/<input[^>]*name="indicator"[^>]*>/g) ?? [];
  return boxes
    .filter((box) => box.includes('checked=""'))
    .map((box) => box.match(/value="([^"]*)"/)?.[1] ?? "");
}

beforeEach(() => {
  shown.answer = { error: null, done: null };
  shown.sent = [];
  vi.mocked(saveStageBreakdownAction).mockReset();
});

describe("the Penjabaran form after a refused save", () => {
  it("stays open: the box is not told it was saved, and the browser does not send and empty the form", async () => {
    vi.mocked(saveStageBreakdownAction).mockResolvedValue(REFUSED);
    const onSaved = vi.fn();

    const isKeptFromBrowser = await pressSave(onSaved);

    expect(saveStageBreakdownAction).toHaveBeenCalledTimes(1);
    expect(await shown.sent[0]).toEqual(REFUSED);
    expect(onSaved).not.toHaveBeenCalled();
    expect(isKeptFromBrowser).toBe(true);
  });

  it("shows the message with what was typed still in its fields", () => {
    shown.answer = REFUSED;

    const html = renderToStaticMarkup(
      <BreakdownForm {...formProps(() => {})} />,
    );

    expect(html).toContain(REFUSED.error);
    expect(html).toMatch(
      /<textarea name="text"[^>]*>Teks yang diketik\.<\/textarea>/,
    );
    expect(html).toMatch(/name="activity"[^>]*value="Kegiatan diketik"/);
    expect(tickedIndicators(html)).toEqual(["M1", "M3"]);
    expect(html).toContain(`name="version" value="${TYPED.version}"`);
  });

  it("closes once the save is kept, with its message", async () => {
    vi.mocked(saveStageBreakdownAction).mockResolvedValue({
      error: null,
      done: "Penjabaran Mandiri disimpan.",
    });
    const onSaved = vi.fn();

    await pressSave(onSaved);

    expect(onSaved).toHaveBeenCalledWith("Penjabaran Mandiri disimpan.");
  });
});
