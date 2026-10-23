import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentCoaching } from "./student-coaching";
import { StudentCoachingView } from "./student-coaching-view";

function shown(
  more: Partial<StudentCoaching> = {},
  forStudent = false,
): string {
  const coaching: StudentCoaching = {
    level: "intensive",
    weakest: "M",
    status: "identified",
    note: "",
    ...more,
  };
  return renderToStaticMarkup(
    <StudentCoachingView coaching={coaching} forStudent={forStudent} />,
  );
}

describe("Pembinaan (level) in the student detail", () => {
  it.each([
    ["intensive", "Pembinaan intensif"],
    ["moderate", "Pembinaan sedang"],
    ["light", "Pembinaan ringan"],
  ] as const)("titles the %s level %s", (level, title) => {
    expect(shown({ level })).toContain(`>${title}</h2>`);
  });

  it.each([
    ["identified", "Teridentifikasi"],
    ["counselling", "Konseling"],
    ["monitoring", "Pemantauan"],
    ["done", "Selesai"],
  ] as const)("shows the status %s as the badge %s", (status, words) => {
    expect(shown({ status })).toMatch(
      new RegExp(`<span class="[^"]*">${words}</span>`),
    );
  });

  it("names the weakest value without its score, and the note after it on the same line", () => {
    const box = shown({ weakest: "A", note: "Dipanggil untuk konseling." });

    expect(box).toMatch(
      /<p [^>]*>Aspek terlemah: Adaptif\. Dipanggil untuk konseling\.<\/p>/,
    );
  });

  it("ends the line after the weakest value when there is no note", () => {
    expect(shown()).toMatch(/<p [^>]*>Aspek terlemah: Mandiri\.<\/p>/);
  });

  it("has no button and no link", () => {
    const box = shown({ note: "Dipantau." });

    expect(box).not.toContain("<button");
    expect(box).not.toContain("<a ");
    expect(box).not.toContain("<select");
  });
});

describe("Pembinaan (level) on Profil saya", () => {
  it("adds who to talk to about the next step, which staff do not see", () => {
    const sentence = "Bicarakan langkah berikutnya dengan pengasuh Anda.";

    expect(shown({}, true)).toContain(sentence);
    expect(shown({}, true)).toContain("Aspek terlemah: ");
    expect(shown()).not.toContain(sentence);
  });
});
