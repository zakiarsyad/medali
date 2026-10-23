import { describe, expect, it } from "vitest";
import { dataLine, givenSharingTitle, recipientsLine } from "./sharing-words";

describe("the recipients of a sharing in one line", () => {
  it("are named by their role in the order of the form, whatever order they were kept in", () => {
    expect(recipientsLine(["mentor", "head_of_program", "head_of_unit"])).toBe(
      "Kepala Unit Pembangunan Karakter, Ketua Program Studi, Pengasuh",
    );
  });
});

describe("the data of a sharing in one line", () => {
  it("is in the order of the form, as the prototype words it", () => {
    expect(dataLine(["summary", "counselling"])).toBe(
      "status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi; ringkasan pendampingan yang ditulis konselor",
    );
  });
});

describe("the title of a sharing the student gave", () => {
  it("says the data is shared once published, and that approval is given before", () => {
    expect(givenSharingTitle("published")).toBe("Data dibagikan");
    expect(givenSharingTitle("approved")).toBe(
      "Persetujuan berbagi data diberikan",
    );
  });
});
