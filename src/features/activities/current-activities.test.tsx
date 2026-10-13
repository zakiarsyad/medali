import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { cardOf } from "./activity-card";
import { CurrentActivities } from "./current-activities";
import type { StudentSchedule } from "./student-schedule";
import {
  TEST_NOW,
  TEST_SENT_PHOTO,
  TEST_STUDENT_SCHEDULE,
} from "./test-student-schedules";

function shown(schedule: StudentSchedule, now = TEST_NOW): string {
  return renderToStaticMarkup(
    <CurrentActivities cards={[cardOf(schedule, now)]} />,
  );
}

const BUTTON = "Unggah foto kehadiran</button>";

describe("CurrentActivities", () => {
  it('offers "Unggah foto kehadiran" while the upload time is open and nothing was sent', () => {
    expect(shown(TEST_STUDENT_SCHEDULE)).toContain(BUTTON);
  });

  it("offers no upload before the first hour of the schedule", () => {
    const early = { day: "2026-10-13", time: "07:00" };

    expect(shown(TEST_STUDENT_SCHEDULE, early)).not.toContain(BUTTON);
  });

  it.each(["waiting", "valid", "rejected", "dispensation"] as const)(
    "offers no upload when the attendance is %s",
    (status) => {
      const attendance = { ...TEST_SENT_PHOTO, status };

      expect(shown({ ...TEST_STUDENT_SCHEDULE, attendance })).not.toContain(
        BUTTON,
      );
    },
  );
});

describe("the upload of a card", () => {
  const SENDER = readFileSync(
    "src/features/activities/photo-sender.tsx",
    "utf8",
  );

  it("takes a photo with the camera of the phone, or picks a picture", () => {
    expect(SENDER).toContain('accept="image/*"');
    expect(SENDER).toContain('capture={camera ? "user" : undefined}');
    expect(SENDER).toContain('label="Ambil foto"');
    expect(SENDER).toContain('label="Pilih gambar"');
  });

  it('shows the photo with "Kirim presensi", "Ulangi" and "Batal"', () => {
    expect(SENDER).toContain("<img");
    for (const words of ["Kirim presensi", "Ulangi", "Batal"]) {
      expect(SENDER).toContain(words);
    }
  });

  it("makes the photo smaller before it is sent, and sends nothing that is not a picture or is too large", () => {
    const pick = SENDER.slice(
      SENDER.indexOf("function pick("),
      SENDER.indexOf("function send("),
    );

    expect(pick).toContain("pickedPhotoFault(file.type, file.size)");
    expect(pick).toContain("if (wrong) return setFault(wrong);");
    expect(pick).toContain("await shrinkPhoto(file)");
    expect(pick).not.toContain("sendAttendancePhotoAction");
  });

  it("says so when sending fails halfway, and leaves the photo to be sent again", () => {
    const send = SENDER.slice(
      SENDER.indexOf("function send("),
      SENDER.lastIndexOf("return ("),
    );

    expect(send).toContain("onAnswer({ error: SEND_FAILED, done: null });");
    expect(send).not.toContain("setPhoto(null)");
  });
});
