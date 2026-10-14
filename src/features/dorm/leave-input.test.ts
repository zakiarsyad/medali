import { describe, expect, it } from "vitest";
import {
  NO_KIND,
  NO_SPECIAL_REASON,
  PURPOSE_TOO_SHORT,
  parseLeave,
  type SentLeave,
} from "./leave-input";
import { OUTING_DOES_NOT_FIT } from "./leave-rules";

// 10:00 on campus on 14 October 2026.
const NOW = new Date("2026-10-14T03:00:00Z");

function sent(more: Partial<SentLeave> = {}): SentLeave {
  return {
    kind: "outing",
    startsAt: "2026-10-15T09:00",
    endsAt: "2026-10-15T16:00",
    specialReason: "",
    purpose: "  Membeli buku kuliah  ",
    destination: " Bintaro ",
    contact: " 0812 ",
    ...more,
  };
}

describe("parseLeave", () => {
  it("keeps Izin pesiar with its times in campus time and its words trimmed", () => {
    expect(parseLeave(sent(), NOW)).toEqual({
      ok: true,
      value: {
        kind: "outing",
        start: new Date("2026-10-15T02:00:00Z"),
        end: new Date("2026-10-15T09:00:00Z"),
        specialReason: null,
        purpose: "Membeli buku kuliah",
        destination: "Bintaro",
        contact: "0812",
      },
    });
  });

  it("keeps no Tujuan, Kontak nor Jenis keperluan for ITMK", () => {
    const parsed = parseLeave(
      sent({ kind: "skip_activities", specialReason: "sick" }),
      NOW,
    );

    expect(parsed.ok && parsed.value).toMatchObject({
      destination: "",
      contact: "",
      specialReason: null,
    });
  });

  it("keeps Jenis keperluan of Izin khusus, and refuses one without it", () => {
    const special = sent({ kind: "special", specialReason: "family" });

    expect(parseLeave(special, NOW)).toMatchObject({
      ok: true,
      value: { specialReason: "family" },
    });
    expect(parseLeave({ ...special, specialReason: "lain" }, NOW)).toEqual({
      ok: false,
      error: NO_SPECIAL_REASON,
    });
  });

  it("refuses a kind it does not know", () => {
    expect(parseLeave(sent({ kind: "cuti" }), NOW)).toEqual({
      ok: false,
      error: NO_KIND,
    });
  });

  it("refuses a missing time, in the words of the kind", () => {
    expect(parseLeave(sent({ endsAt: "" }), NOW)).toEqual({
      ok: false,
      error: "Isi tanggal dan jam pada Berangkat dan Kembali.",
    });
    expect(
      parseLeave(sent({ kind: "skip_activities", startsAt: "besok" }), NOW),
    ).toEqual({
      ok: false,
      error: "Isi tanggal dan jam pada Dari dan Sampai.",
    });
  });

  it("refuses times that break the rules, saying why", () => {
    expect(parseLeave(sent({ endsAt: "2026-10-15T22:00" }), NOW)).toEqual({
      ok: false,
      error: OUTING_DOES_NOT_FIT,
    });
    expect(
      parseLeave(
        sent({ startsAt: "2026-10-14T09:00", endsAt: "2026-10-14T16:00" }),
        NOW,
      ),
    ).toEqual({
      ok: false,
      error: "Waktu berangkat sudah lewat.",
    });
  });

  it("refuses Keperluan under 5 letters, not counting spaces around it", () => {
    expect(parseLeave(sent({ purpose: "  Beli  " }), NOW)).toEqual({
      ok: false,
      error: PURPOSE_TOO_SHORT,
    });
    expect(parseLeave(sent({ purpose: "Makan" }), NOW).ok).toBe(true);
  });

  it("refuses words longer than their field holds", () => {
    expect(parseLeave(sent({ purpose: "a".repeat(501) }), NOW)).toEqual({
      ok: false,
      error: "Keperluan paling banyak 500 huruf.",
    });
    expect(parseLeave(sent({ destination: "a".repeat(201) }), NOW)).toEqual({
      ok: false,
      error: "Tujuan paling banyak 200 huruf.",
    });
    expect(parseLeave(sent({ contact: "1".repeat(101) }), NOW)).toEqual({
      ok: false,
      error: "Kontak paling banyak 100 huruf.",
    });
  });
});
