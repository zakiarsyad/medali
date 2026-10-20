import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ConsentStatus } from "./consent-ids";
import type { ConsentView } from "./consent-view";
import { CounsellorSessionPart } from "./counsellor-session-part";
import { SessionForm } from "./session-form";
import type { SessionHistory, SessionView } from "./session-view";
import { NEEDS_CONSENT, NO_SESSIONS } from "./session-words";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

const STUDENT_ID = "00000000-0000-4000-8000-00000005e551";

function consentOf(status: ConsentStatus): ConsentView {
  return {
    status,
    way: status === "approved" ? "paper" : null,
    changedAt: MOMENT,
    counsellorName: null,
    version: MOMENT.toISOString(),
  };
}

const NO_HISTORY: SessionHistory = { items: [], hasMore: false };

function partOf(
  consent: ConsentView | null,
  history: SessionHistory = NO_HISTORY,
): string {
  return renderToStaticMarkup(
    <CounsellorSessionPart
      studentId={STUDENT_ID}
      consent={consent}
      history={{ ok: true, value: history }}
    />,
  );
}

const SESSION: SessionView = {
  id: "00000000-0000-4000-8000-0000005e5501",
  day: "2026-10-19",
  kind: "group",
  topic: "family",
  notes: "Catatan uji layar.",
  followUp: "next_session",
  nextDay: "2026-10-26",
  counsellorName: "Konselor Uji Layar",
  changed: null,
  version: MOMENT.toISOString(),
};

function optionsOf(page: string, name: string): string[] {
  const select = page.match(
    new RegExp(`<select name="${name}"[^>]*>(.*?)</select>`),
  );
  return [
    ...(select?.[1] ?? "").matchAll(/<option[^>]*>([^<]*)<\/option>/g),
  ].map((match) => match[1] ?? "");
}

describe("the sessions of a student picked by Konselor", () => {
  it.each([null, ...(["waiting", "declined", "withdrawn"] as const)])(
    "say a session needs the consent, with no form, while it is %s",
    (status) => {
      const page = partOf(status === null ? null : consentOf(status));

      expect(page).toContain(NEEDS_CONSENT);
      expect(page).not.toContain("Catat sesi");
      expect(page).not.toContain("<form");
    },
  );

  it("offer Catat sesi with every field once the consent is Disetujui", () => {
    const page = partOf(consentOf("approved"));

    expect(page).not.toContain(NEEDS_CONSENT);
    expect(page).toContain("Catat sesi");
    expect(page).toContain("Tanggal sesi");
    expect(page).toMatch(/<input type="date"[^>]*name="day"/);
    expect(optionsOf(page, "kind")).toEqual([
      "Individu tatap muka",
      "Individu daring",
      "Kelompok",
    ]);
    expect(optionsOf(page, "topic")).toEqual([
      "Akademik",
      "Adaptasi kampus",
      "Keluarga",
      "Relasi sosial",
      "Keuangan",
      "Emosi dan stres",
      "Lainnya",
    ]);
    expect(page).toContain("Catatan sesi (rahasia)");
    expect(optionsOf(page, "followUp")).toEqual([
      "Sesi lanjutan",
      "Pemantauan",
      "Rujuk ke psikolog klinis",
      "Rujuk ke psikiater",
      "Selesai",
    ]);
    expect(page).toContain("Sesi berikutnya (opsional)");
    expect(page).toContain(`name="studentId" value="${STUDENT_ID}"`);
    expect(page).toContain("Simpan sesi");
  });
});

describe("Catat sesi opened by Tandai selesai", () => {
  it("is for that schedule, under the student's name, starting with its day and the Jenis of its Cara", () => {
    const page = renderToStaticMarkup(
      <SessionForm
        studentId={STUDENT_ID}
        start={{
          scheduleId: "00000000-0000-4000-8000-0000005c0ed1",
          studentId: STUDENT_ID,
          name: "Mahasiswa Uji Layar Sesi",
          day: "2026-10-19",
          kind: "individual_online",
        }}
      />,
    );

    expect(page).toContain("Catat sesi");
    expect(page).toContain("Mahasiswa Uji Layar Sesi");
    expect(page).toContain(
      'name="scheduleId" value="00000000-0000-4000-8000-0000005c0ed1"',
    );
    expect(page).toMatch(/name="day" value="2026-10-19"/);
    expect(page).toContain(
      '<option value="individual_online" selected="">Individu daring</option>',
    );
  });

  it("is for no schedule when written from Persetujuan konseling", () => {
    const page = renderToStaticMarkup(<SessionForm studentId={STUDENT_ID} />);

    expect(page).toContain('name="scheduleId" value=""');
  });
});

describe("Riwayat sesi of a student picked by Konselor", () => {
  it("says Belum ada sesi. while there is none", () => {
    const page = partOf(consentOf("approved"));

    expect(page).toContain("Riwayat sesi");
    expect(page).toContain(NO_SESSIONS);
  });

  it("shows each session with its date, Jenis, Topik, Konselor, Tindak lanjut, next session and notes, with Ubah", () => {
    const page = partOf(consentOf("approved"), {
      items: [SESSION],
      hasMore: false,
    });

    expect(page).toContain("19 Okt 2026 · Kelompok · Keluarga");
    expect(page).toContain(
      "Konselor Konselor Uji Layar. Tindak lanjut: Sesi lanjutan, sesi berikutnya 26 Okt 2026.",
    );
    expect(page).toContain("Catatan uji layar.");
    expect(page).toContain(">Ubah</button>");
    expect(page).not.toContain("Diubah");
    expect(page).not.toContain("Tampilkan lebih banyak");
  });

  it("says when and by whom a session was changed last", () => {
    const page = partOf(consentOf("approved"), {
      items: [
        {
          ...SESSION,
          changed: { at: MOMENT, by: "Konselor Uji Lain" },
        },
      ],
      hasMore: false,
    });

    expect(page).toContain("Diubah 16 Okt 2026 oleh Konselor Uji Lain");
  });

  it("still shows past sessions once the consent is withdrawn, with no Ubah and no form", () => {
    const page = partOf(consentOf("withdrawn"), {
      items: [SESSION],
      hasMore: false,
    });

    expect(page).toContain("Catatan uji layar.");
    expect(page).not.toContain(">Ubah</button>");
    expect(page).not.toContain("Simpan sesi");
    expect(page).toContain(NEEDS_CONSENT);
  });

  it("offers more when there are more", () => {
    const page = partOf(consentOf("approved"), {
      items: [SESSION],
      hasMore: true,
    });

    expect(page).toContain("Tampilkan lebih banyak");
  });
});
