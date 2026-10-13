import { describe, expect, it } from "vitest";
import {
  markField,
  parseAttendance,
  type SentAttendance,
  sentMarks,
  TOPIC_MAX_LENGTH,
} from "./attendance-input";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7201";
const ANI = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7202";
const BUDI = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7203";

function sent(more: Partial<SentAttendance> = {}): SentAttendance {
  return {
    groupId: GROUP_ID,
    number: "2",
    heldOn: "2026-10-10",
    topic: "Refleksi nilai Mandiri dan Disiplin",
    marks: [
      [ANI, "present"],
      [BUDI, "sick"],
    ],
    ...more,
  };
}

function errorOf(more: Partial<SentAttendance>): string | null {
  const parsed = parseAttendance(sent(more));
  return parsed.ok ? null : parsed.error;
}

describe("parseAttendance", () => {
  it("takes a list with a group, a meeting, a day, a topic and a mark for each member", () => {
    expect(parseAttendance(sent())).toEqual({
      ok: true,
      value: {
        groupId: GROUP_ID,
        number: 2,
        heldOn: "2026-10-10",
        topic: "Refleksi nilai Mandiri dan Disiplin",
        marks: { [ANI]: "present", [BUDI]: "sick" },
      },
    });
  });

  it("takes a list for a group without members", () => {
    const parsed = parseAttendance(sent({ marks: [] }));

    expect(parsed.ok && parsed.value.marks).toEqual({});
  });

  it("refuses an empty topic, and says to fill it in", () => {
    expect(errorOf({ topic: "" })).toBe("Isi topik pertemuan.");
    expect(errorOf({ topic: "   \n " })).toBe("Isi topik pertemuan.");
  });

  it("keeps the topic without the blanks around it", () => {
    const parsed = parseAttendance(sent({ topic: "  Topik bebas  " }));

    expect(parsed.ok && parsed.value.topic).toBe("Topik bebas");
  });

  it("takes a topic of 200 characters and refuses one of 201", () => {
    expect(errorOf({ topic: "a".repeat(TOPIC_MAX_LENGTH) })).toBeNull();
    expect(errorOf({ topic: "a".repeat(TOPIC_MAX_LENGTH + 1) })).toContain(
      "200",
    );
  });

  it("refuses a topic with a character the database cannot keep", () => {
    expect(errorOf({ topic: "Topik\u0000" })).not.toBeNull();
  });

  it.each(["", "2026-02-30", "10/10/2026", "besok"])(
    "refuses %o as the day",
    (heldOn) => {
      expect(errorOf({ heldOn })).toBe("Isi tanggal pertemuan dengan benar.");
    },
  );

  it.each(["5", "0", "-1", "1.5", "", "dua"])(
    "refuses %o as the meeting: a period has four",
    (number) => {
      expect(errorOf({ number })).toContain("4 pertemuan");
    },
  );

  it.each(["", "semua", `${GROUP_ID}x`])(
    "refuses %o as the group",
    (groupId) => {
      expect(errorOf({ groupId })).not.toBeNull();
    },
  );

  it("refuses a mark that is none of the four", () => {
    expect(errorOf({ marks: [[ANI, "late"]] })).not.toBeNull();
    expect(errorOf({ marks: [[ANI, ""]] })).not.toBeNull();
  });

  it("refuses a mark for what is no student", () => {
    expect(errorOf({ marks: [["bukan-id", "present"]] })).not.toBeNull();
  });

  it("refuses two marks for one student", () => {
    const twice: SentAttendance["marks"] = [
      [ANI, "present"],
      [ANI, "absent"],
    ];

    expect(errorOf({ marks: twice })).not.toBeNull();
  });
});

describe("sentMarks", () => {
  it("reads the mark of each student from the fields of the form", () => {
    const form = new FormData();
    form.set("groupId", GROUP_ID);
    form.set(markField(ANI), "present");
    form.set(markField(BUDI), "absent");

    expect(sentMarks(form)).toEqual([
      [ANI, "present"],
      [BUDI, "absent"],
    ]);
  });

  it("reads a field sent twice as two marks, which the check then refuses", () => {
    const form = new FormData();
    form.append(markField(ANI), "present");
    form.append(markField(ANI), "absent");

    expect(sentMarks(form)).toHaveLength(2);
  });
});
