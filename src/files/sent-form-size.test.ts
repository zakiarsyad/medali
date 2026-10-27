import { describe, expect, it } from "vitest";
import {
  formBytes,
  isRefusedForSize,
  SENT_FORM_MAX_BYTES,
} from "./sent-form-size";

/** What the app answers when a sent form is over its own limit. */
const OVER_APP_LIMIT = new Error(
  `Body exceeded ${SENT_FORM_MAX_BYTES} limit.\nTo configure the body size limit for Server Actions, see: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit`,
);

/** What the browser is told for any answer that is not the app's, such as the hosting's refusal. */
const UNEXPECTED_ANSWER = new Error(
  "An unexpected response was received from the server.",
);

const OFFLINE = new TypeError("Failed to fetch");

function formWithFile(bytes: number): FormData {
  const form = new FormData();
  form.set("reason", "campus_duty");
  form.set("file", new Blob([new Uint8Array(bytes)]), "surat.pdf");
  return form;
}

describe("formBytes", () => {
  it("counts the names, the texts as sent and the files of a form", () => {
    const form = new FormData();
    form.set("é", "ab");
    form.set("file", new Blob([new Uint8Array(10)]), "a.pdf");

    expect(formBytes(form)).toBe(2 + 2 + 4 + 10);
  });
});

describe("isRefusedForSize", () => {
  it("tells the app's own refusal of a form over its limit", () => {
    expect(isRefusedForSize(OVER_APP_LIMIT, formWithFile(10))).toBe(true);
  });

  it("counts any failure of a form over the limit as a refusal for size", () => {
    const large = formWithFile(SENT_FORM_MAX_BYTES);

    expect(isRefusedForSize(UNEXPECTED_ANSWER, large)).toBe(true);
    expect(isRefusedForSize(OFFLINE, large)).toBe(true);
  });

  it("takes other failures of a form within the limit for what they are", () => {
    const small = formWithFile(10);

    expect(isRefusedForSize(UNEXPECTED_ANSWER, small)).toBe(false);
    expect(isRefusedForSize(OFFLINE, small)).toBe(false);
    expect(isRefusedForSize("Body exceeded", small)).toBe(false);
  });
});
