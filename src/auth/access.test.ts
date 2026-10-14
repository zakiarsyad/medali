import { describe, expect, it } from "vitest";
import {
  type AccountForAccess,
  may,
  mayOpenPage,
  mayOpenTab,
  needsDormResident,
  pagesFor,
  pagesForAccount,
  rowLimitForAction,
  rowLimitForPage,
  rowLimitForTab,
  tabsFor,
} from "./access";
import { BAM_ROLES, isBamRole } from "./bam-roles";
import { PAGES } from "./pages";
import { ROLE_IDS, type RoleId } from "./role-ids";
import { ACTION_TITLES, ACTIONS, type Action, ROLES } from "./roles";

function paths(items: readonly { path: string }[]): string[] {
  return items.map((item) => item.path);
}

describe("may", () => {
  it("lets Kepala Unit manage users", () => {
    expect(may(["head_of_unit"], "manage_users")).toBe(true);
  });

  it("refuses every other role to manage users", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    for (const role of others) {
      expect(may([role], "manage_users")).toBe(false);
    }
  });

  const studentInputRoles: RoleId[] = [
    "head_of_unit",
    "upk_staff",
    "dorm_manager",
  ];

  it.each(studentInputRoles)("lets %s input new students", (role) => {
    expect(may([role], "input_new_students")).toBe(true);
  });

  it("refuses every other role to input new students", () => {
    const others = ROLE_IDS.filter((role) => !studentInputRoles.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - studentInputRoles.length);
    for (const role of others) {
      expect(may([role], "input_new_students")).toBe(false);
    }
  });

  it("gives the right to input new students to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "input_new_students")).toBe(
        mayOpenTab([role], "settings", "new_students"),
      );
    }
  });

  const curriculumRoles: RoleId[] = ["head_of_unit", "upk_staff"];

  it.each(curriculumRoles)("lets %s change the curriculum", (role) => {
    expect(may([role], "change_curriculum")).toBe(true);
  });

  it("refuses every other role to change the curriculum", () => {
    const others = ROLE_IDS.filter((role) => !curriculumRoles.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - curriculumRoles.length);
    for (const role of others) {
      expect(may([role], "change_curriculum")).toBe(false);
    }
  });

  it("lets every role that may change the curriculum open Kurikulum", () => {
    for (const role of curriculumRoles) {
      expect(mayOpenPage([role], "curriculum")).toBe(true);
    }
  });

  const activityRoles: RoleId[] = ["head_of_unit", "upk_staff"];

  it.each(activityRoles)("lets %s manage activities", (role) => {
    expect(may([role], "manage_activities")).toBe(true);
  });

  it("refuses every other role to manage activities", () => {
    const others = ROLE_IDS.filter((role) => !activityRoles.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - activityRoles.length);
    for (const role of others) {
      expect(may([role], "manage_activities")).toBe(false);
    }
  });

  it("lets every role that may manage activities open Kurikulum", () => {
    for (const role of activityRoles) {
      expect(mayOpenPage([role], "curriculum")).toBe(true);
    }
  });

  // Kurikulum shows how often each activity is scheduled, campus-wide.
  const curriculumReaders: RoleId[] = [
    "head_of_unit",
    "upk_staff",
    "director",
    "head_of_program",
    "mentor",
  ];

  it.each(curriculumReaders)("lets %s open Kurikulum", (role) => {
    expect(mayOpenPage([role], "curriculum")).toBe(true);
  });

  it("refuses Kurikulum to every other role", () => {
    const others = ROLE_IDS.filter((role) => !curriculumReaders.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - curriculumReaders.length);
    for (const role of others) {
      expect(mayOpenPage([role], "curriculum")).toBe(false);
    }
  });

  it("lets Kepala Unit set the academic periods", () => {
    expect(may(["head_of_unit"], "set_academic_periods")).toBe(true);
  });

  it("refuses every other role to set the academic periods", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "set_academic_periods")).toBe(false);
    }
  });

  it("gives the right to set the academic periods to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "set_academic_periods")).toBe(
        mayOpenTab([role], "settings", "academic_periods"),
      );
    }
  });

  const roomViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "dorm_manager",
    "bam_bphk",
    "bam_household",
  ];

  it.each(roomViewers)("lets %s see the dorm rooms", (role) => {
    expect(may([role], "view_dorm_rooms")).toBe(true);
  });

  it("refuses every other role to see the dorm rooms", () => {
    const others = ROLE_IDS.filter((role) => !roomViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - roomViewers.length);
    for (const role of others) {
      expect(may([role], "view_dorm_rooms")).toBe(false);
    }
  });

  it.each(["student", "mentor", "bam_compliance"] as const)(
    "refuses %s to see the dorm rooms",
    (role) => {
      expect(may([role], "view_dorm_rooms")).toBe(false);
      expect(mayOpenTab([role], "dorm", "rooms")).toBe(false);
    },
  );

  it("gives the right to see the dorm rooms to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_dorm_rooms")).toBe(
        mayOpenTab([role], "dorm", "rooms"),
      );
    }
  });

  const roomManagers: RoleId[] = ["dorm_manager", "bam_household"];

  it.each(roomManagers)("lets %s manage the dorm rooms", (role) => {
    expect(may([role], "manage_dorm_rooms")).toBe(true);
  });

  it("refuses every other role to manage the dorm rooms", () => {
    const others = ROLE_IDS.filter((role) => !roomManagers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - roomManagers.length);
    for (const role of others) {
      expect(may([role], "manage_dorm_rooms")).toBe(false);
    }
  });

  it("lets every role that may manage the dorm rooms see them", () => {
    for (const role of roomManagers) {
      expect(may([role], "view_dorm_rooms")).toBe(true);
    }
  });

  const companionViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "dorm_manager",
    "bam_bphk",
  ];

  it.each(companionViewers)("lets %s see the kakak pendamping", (role) => {
    expect(may([role], "view_dorm_companions")).toBe(true);
  });

  it("refuses every other role to see the kakak pendamping", () => {
    const others = ROLE_IDS.filter((role) => !companionViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - companionViewers.length);
    for (const role of others) {
      expect(may([role], "view_dorm_companions")).toBe(false);
    }
  });

  it.each(["student", "mentor", "bam_compliance", "bam_household"] as const)(
    "refuses %s to see the kakak pendamping",
    (role) => {
      expect(may([role], "view_dorm_companions")).toBe(false);
      expect(mayOpenTab([role], "dorm", "companions")).toBe(false);
    },
  );

  it("gives the right to see the kakak pendamping to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_dorm_companions")).toBe(
        mayOpenTab([role], "dorm", "companions"),
      );
    }
  });

  it("lets dorm_manager manage the kakak pendamping", () => {
    expect(may(["dorm_manager"], "manage_dorm_companions")).toBe(true);
  });

  it("refuses every other role to manage the kakak pendamping", () => {
    const others = ROLE_IDS.filter((role) => role !== "dorm_manager");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "manage_dorm_companions")).toBe(false);
    }
  });

  it.each(["head_of_unit", "bam_household"] as const)(
    "refuses %s to manage the kakak pendamping",
    (role) => {
      expect(may([role], "manage_dorm_companions")).toBe(false);
    },
  );

  const activityViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "dorm_manager",
    ...BAM_ROLES,
  ];

  it.each(activityViewers)(
    "lets %s see the schedule of the dorm activities",
    (role) => {
      expect(may([role], "view_dorm_activities")).toBe(true);
      expect(mayOpenTab([role], "dorm", "activities")).toBe(true);
    },
  );

  it("refuses every other role to see the schedule of the dorm activities", () => {
    const others = ROLE_IDS.filter((role) => !activityViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - activityViewers.length);
    for (const role of others) {
      expect(may([role], "view_dorm_activities")).toBe(false);
    }
  });

  it.each(["mentor", "upk_staff", "counsellor"] as const)(
    "refuses %s the tab Kegiatan asrama and both ways to see the dorm activities",
    (role) => {
      expect(mayOpenTab([role], "dorm", "activities")).toBe(false);
      expect(may([role], "view_dorm_activities")).toBe(false);
      expect(may([role], "view_own_dorm_activities")).toBe(false);
    },
  );

  it("lets Mahasiswa see the dorm activities as a resident only, on a page that asks them to live in the dorm", () => {
    expect(may(["student"], "view_own_dorm_activities")).toBe(true);
    expect(may(["student"], "view_dorm_activities")).toBe(false);
    expect(mayOpenTab(["student"], "dorm", "activities")).toBe(true);
    expect(needsDormResident(["student"], "dorm")).toBe(true);
  });

  it("refuses every other role to see the dorm activities as a resident", () => {
    const others = ROLE_IDS.filter((role) => role !== "student");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "view_own_dorm_activities")).toBe(false);
    }
  });

  it("gives a way to see the dorm activities to every role with the tab Kegiatan asrama, and to no other", () => {
    for (const role of ROLE_IDS) {
      const sees =
        may([role], "view_dorm_activities") ||
        may([role], "view_own_dorm_activities");

      expect(sees).toBe(mayOpenTab([role], "dorm", "activities"));
    }
  });

  it("lets dorm_manager manage the dorm activities", () => {
    expect(may(["dorm_manager"], "manage_dorm_activities")).toBe(true);
    expect(may(["dorm_manager"], "view_dorm_activities")).toBe(true);
  });

  it("refuses every other role to manage the dorm activities", () => {
    const others = ROLE_IDS.filter((role) => role !== "dorm_manager");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "manage_dorm_activities")).toBe(false);
    }
  });

  it.each(["head_of_unit", "student", ...BAM_ROLES] as const)(
    "refuses %s to manage the dorm activities",
    (role) => {
      expect(may([role], "manage_dorm_activities")).toBe(false);
    },
  );

  it.each(BAM_ROLES)(
    "lets %s count and announce the attendance at the dorm activities, and see it",
    (role) => {
      expect(may([role], "count_dorm_attendance")).toBe(true);
      expect(may([role], "view_dorm_attendance")).toBe(true);
    },
  );

  it("refuses every other role to count the attendance at the dorm activities", () => {
    const others = ROLE_IDS.filter((role) => !isBamRole(role));
    expect(others.length).toBe(ROLE_IDS.length - BAM_ROLES.length);
    for (const role of others) {
      expect(may([role], "count_dorm_attendance")).toBe(false);
    }
  });

  it.each(["dorm_manager", "head_of_unit", "director", "student"] as const)(
    "refuses %s to count the attendance at the dorm activities",
    (role) => {
      expect(may([role], "count_dorm_attendance")).toBe(false);
    },
  );

  it.each(activityViewers)(
    "lets %s see the attendance at the dorm activities",
    (role) => {
      expect(may([role], "view_dorm_attendance")).toBe(true);
    },
  );

  it("refuses every other role to see the attendance at the dorm activities", () => {
    const others = ROLE_IDS.filter((role) => !activityViewers.includes(role));
    for (const role of others) {
      expect(may([role], "view_dorm_attendance")).toBe(false);
    }
  });

  it("gives the right to see the attendance to exactly the roles that see the schedule", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_dorm_attendance")).toBe(
        may([role], "view_dorm_activities"),
      );
    }
  });

  it("lets Mahasiswa see their own attendance at the dorm activities only", () => {
    expect(may(["student"], "view_own_dorm_attendance")).toBe(true);
    expect(may(["student"], "view_dorm_attendance")).toBe(false);
    expect(may(["student"], "count_dorm_attendance")).toBe(false);
  });

  it("refuses every other role to see attendance at the dorm activities as a resident", () => {
    const others = ROLE_IDS.filter((role) => role !== "student");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "view_own_dorm_attendance")).toBe(false);
    }
  });

  const leaveViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "dorm_manager",
    "bam_bphk",
  ];

  it.each(leaveViewers)(
    "lets %s see the dorm leave requests on Perizinan asrama",
    (role) => {
      expect(may([role], "view_dorm_leave")).toBe(true);
      expect(mayOpenTab([role], "dorm", "leave")).toBe(true);
    },
  );

  it("refuses every other role to see the dorm leave requests, the other BAM roles and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => !leaveViewers.includes(role));
    expect(others).toEqual(
      expect.arrayContaining(["bam_compliance", "bam_health", "student"]),
    );
    for (const role of others) {
      expect(may([role], "view_dorm_leave")).toBe(false);
    }
  });

  it("lets Pengelola Asrama approve and reject dorm leave", () => {
    expect(may(["dorm_manager"], "decide_dorm_leave")).toBe(true);
  });

  it("refuses every other role to approve and reject dorm leave, BAM - BPHK and Kepala Unit among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "dorm_manager");
    expect(others).toEqual(
      expect.arrayContaining(["bam_bphk", "head_of_unit", "student"]),
    );
    for (const role of others) {
      expect(may([role], "decide_dorm_leave")).toBe(false);
    }
  });

  it("lets Mahasiswa ask for and cancel their own dorm leave, on a page that asks them to live in the dorm", () => {
    expect(may(["student"], "ask_dorm_leave")).toBe(true);
    expect(may(["student"], "view_dorm_leave")).toBe(false);
    expect(mayOpenTab(["student"], "dorm", "leave")).toBe(true);
    expect(needsDormResident(["student"], "dorm")).toBe(true);
  });

  it("refuses every other role to ask for dorm leave", () => {
    const others = ROLE_IDS.filter((role) => role !== "student");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "ask_dorm_leave")).toBe(false);
    }
  });

  it("gives a way to see dorm leave to every role with the tab Perizinan asrama, and to no other", () => {
    for (const role of ROLE_IDS) {
      const sees =
        may([role], "view_dorm_leave") || may([role], "ask_dorm_leave");

      expect(sees).toBe(mayOpenTab([role], "dorm", "leave"));
    }
  });

  const detailReaders: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
  ];

  it.each(detailReaders)("lets %s read a student's detail", (role) => {
    expect(may([role], "view_student_detail")).toBe(true);
  });

  it("refuses every other role to read a student's detail", () => {
    const others = ROLE_IDS.filter((role) => !detailReaders.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - detailReaders.length);
    for (const role of others) {
      expect(may([role], "view_student_detail")).toBe(false);
    }
  });

  it.each(["upk_staff", "student", "counsellor"] as const)(
    "refuses %s to read a student's detail",
    (role) => {
      expect(may([role], "view_student_detail")).toBe(false);
    },
  );

  it("gives the right to read a student's detail to every role with Mahasiswa", () => {
    for (const role of ROLE_IDS) {
      if (!mayOpenPage([role], "students")) continue;
      expect(may([role], "view_student_detail")).toBe(true);
    }
  });

  it("gives Pengasuh a student's detail without the Mahasiswa menu, and no other role one without the other", () => {
    const withoutMenu = ROLE_IDS.filter(
      (role) =>
        may([role], "view_student_detail") && !mayOpenPage([role], "students"),
    );

    expect(withoutMenu).toEqual(["mentor"]);
    expect(paths(pagesFor(["mentor"]))).not.toContain("mahasiswa");
  });

  it("opens Pengasuh the detail of their own mentees only, whatever wide role they also hold", () => {
    const own = {
      kind: "some",
      studyProgramIds: [],
      menteesOf: ["account-1"],
      studentIds: [],
    };
    const wideWithoutDetail = ROLE_IDS.filter(
      (role) =>
        ROLES[role].rows === "all" && !may([role], "view_student_detail"),
    );

    expect(wideWithoutDetail).toContain("upk_staff");
    for (const role of ["mentor", ...wideWithoutDetail] as RoleId[]) {
      const account = {
        id: "account-1",
        roles: ["mentor", role] as RoleId[],
        studyProgramId: null,
        studentId: null,
      };

      expect(rowLimitForAction(account, "view_student_detail")).toEqual(own);
    }
  });

  it("gives every role that reads mentoring notes the detail the notes are shown in", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "view_mentoring_notes")) continue;
      expect(may([role], "view_student_detail")).toBe(true);
    }
  });

  it("lets Kepala Unit see the floor and the room of a student", () => {
    expect(may(["head_of_unit"], "view_student_room")).toBe(true);
  });

  it("refuses every other role the floor and the room of a student", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "view_student_room")).toBe(false);
    }
  });

  it.each(["director", "head_of_program", "dorm_manager"] as const)(
    "refuses %s the floor and the room of a student",
    (role) => {
      expect(may([role], "view_student_room")).toBe(false);
    },
  );

  const groupViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ];

  it.each(groupViewers)("lets %s see the kelompok pengasuhan", (role) => {
    expect(may([role], "view_mentor_groups")).toBe(true);
  });

  it("refuses every other role to see the kelompok pengasuhan", () => {
    const others = ROLE_IDS.filter((role) => !groupViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - groupViewers.length);
    for (const role of others) {
      expect(may([role], "view_mentor_groups")).toBe(false);
    }
  });

  it.each(["mentor", "student"] as const)(
    "refuses %s to see the kelompok pengasuhan and to open Pengasuh",
    (role) => {
      expect(may([role], "view_mentor_groups")).toBe(false);
      expect(mayOpenPage([role], "mentors")).toBe(false);
      expect(mayOpenTab([role], "mentors", "groups")).toBe(false);
    },
  );

  it("gives the right to see the kelompok pengasuhan to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_mentor_groups")).toBe(
        mayOpenTab([role], "mentors", "groups"),
      );
    }
  });

  const mentorViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ];

  it.each(mentorViewers)("lets %s see the list of mentors", (role) => {
    expect(may([role], "view_mentors")).toBe(true);
  });

  it("refuses every other role to see the list of mentors", () => {
    const others = ROLE_IDS.filter((role) => !mentorViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - mentorViewers.length);
    for (const role of others) {
      expect(may([role], "view_mentors")).toBe(false);
    }
  });

  it.each(["mentor", "student"] as const)(
    "refuses %s to see the list of mentors and to open its tab",
    (role) => {
      expect(may([role], "view_mentors")).toBe(false);
      expect(mayOpenPage([role], "mentors")).toBe(false);
      expect(mayOpenTab([role], "mentors", "mentors")).toBe(false);
    },
  );

  it("gives the right to see the list of mentors to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_mentors")).toBe(
        mayOpenTab([role], "mentors", "mentors"),
      );
    }
  });

  const assignmentViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ];

  it.each(assignmentViewers)("lets %s see the penetapan", (role) => {
    expect(may([role], "view_cohort_assignments")).toBe(true);
  });

  it("refuses every other role to see the penetapan", () => {
    const others = ROLE_IDS.filter((role) => !assignmentViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - assignmentViewers.length);
    for (const role of others) {
      expect(may([role], "view_cohort_assignments")).toBe(false);
    }
  });

  it("gives the right to see the penetapan to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_cohort_assignments")).toBe(
        mayOpenTab([role], "mentors", "new_cohort"),
      );
    }
  });

  const assignmentPreparers: RoleId[] = ["head_of_unit", "upk_staff"];

  it.each(assignmentPreparers)("lets %s prepare a penetapan", (role) => {
    expect(may([role], "prepare_cohort_assignments")).toBe(true);
  });

  it("refuses every other role to prepare a penetapan", () => {
    const others = ROLE_IDS.filter(
      (role) => !assignmentPreparers.includes(role),
    );
    expect(others.length).toBe(ROLE_IDS.length - assignmentPreparers.length);
    for (const role of others) {
      expect(may([role], "prepare_cohort_assignments")).toBe(false);
    }
  });

  it.each(["director", "head_of_program", "mentor"] as const)(
    "refuses %s to prepare and to fix a penetapan",
    (role) => {
      expect(may([role], "prepare_cohort_assignments")).toBe(false);
      expect(may([role], "fix_cohort_assignments")).toBe(false);
    },
  );

  it("lets Kepala Unit fix and cancel a penetapan", () => {
    expect(may(["head_of_unit"], "fix_cohort_assignments")).toBe(true);
  });

  it("refuses every other role to fix and cancel a penetapan, Pegawai UPK among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others).toContain("upk_staff");
    for (const role of others) {
      expect(may([role], "fix_cohort_assignments")).toBe(false);
    }
  });

  it("lets every role that may fix a penetapan prepare it, and every role that may prepare it see it", () => {
    for (const role of ROLE_IDS) {
      if (may([role], "fix_cohort_assignments")) {
        expect(may([role], "prepare_cohort_assignments")).toBe(true);
      }
      if (may([role], "prepare_cohort_assignments")) {
        expect(may([role], "view_cohort_assignments")).toBe(true);
      }
    }
  });

  const evaluationViewers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ];

  it.each(evaluationViewers)(
    "lets %s see the evaluations of mentors",
    (role) => {
      expect(may([role], "view_mentor_evaluations")).toBe(true);
    },
  );

  it("refuses every other role to see the evaluations of mentors, Pengasuh among them", () => {
    const others = ROLE_IDS.filter((role) => !evaluationViewers.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - evaluationViewers.length);
    expect(others).toContain("mentor");
    for (const role of others) {
      expect(may([role], "view_mentor_evaluations")).toBe(false);
    }
  });

  it("gives the right to see the evaluations of mentors to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_mentor_evaluations")).toBe(
        mayOpenTab([role], "mentors", "replacement"),
      );
    }
  });

  it("lets Kepala Unit evaluate a mentor", () => {
    expect(may(["head_of_unit"], "evaluate_mentors")).toBe(true);
  });

  it("refuses every other role to evaluate a mentor, Pegawai UPK among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others).toContain("upk_staff");
    expect(others).toContain("director");
    for (const role of others) {
      expect(may([role], "evaluate_mentors")).toBe(false);
    }
  });

  it("lets every role that may evaluate a mentor see the evaluations", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "evaluate_mentors")) continue;
      expect(may([role], "view_mentor_evaluations")).toBe(true);
    }
  });

  it("lets Kepala Unit replace the mentor of a group", () => {
    expect(may(["head_of_unit"], "replace_mentors")).toBe(true);
  });

  it("refuses every other role to replace a mentor, those who read the replacements among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others).toContain("director");
    expect(others).toContain("head_of_program");
    expect(others).toContain("upk_staff");
    expect(others).toContain("mentor");
    for (const role of others) {
      expect(may([role], "replace_mentors")).toBe(false);
    }
  });

  it("lets every role that may replace a mentor open the tab and see the groups, the mentors and their evaluations", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "replace_mentors")) continue;
      expect(mayOpenTab([role], "mentors", "replacement")).toBe(true);
      expect(may([role], "view_mentor_groups")).toBe(true);
      expect(may([role], "view_mentors")).toBe(true);
      expect(may([role], "view_mentor_evaluations")).toBe(true);
    }
  });

  it("names the right to replace a mentor in words for the list of rights", () => {
    expect(ACTION_TITLES.replace_mentors).toBe(
      "Menetapkan dan membatalkan penggantian pengasuh",
    );
  });

  it("lets Kepala Unit manage the survey periods", () => {
    expect(may(["head_of_unit"], "manage_survey_periods")).toBe(true);
  });

  it("refuses every other role to manage the survey periods, those who read the tab among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    expect(others).toContain("director");
    expect(others).toContain("head_of_program");
    expect(others).toContain("upk_staff");
    expect(others).toContain("mentor");
    expect(others).toContain("student");
    for (const role of others) {
      expect(may([role], "manage_survey_periods")).toBe(false);
    }
  });

  it("lets every role that may manage the survey periods open their tab", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "manage_survey_periods")) continue;
      expect(mayOpenTab([role], "mentors", "student_survey")).toBe(true);
    }
  });

  it("names the right to manage the survey periods in words for the list of rights", () => {
    expect(ACTION_TITLES.manage_survey_periods).toBe(
      "Membuka, mengubah, menutup, dan membatalkan periode evaluasi oleh mahasiswa",
    );
  });

  it("opens the tab Evaluasi oleh mahasiswa to Kepala Unit, Direktur, Ketua Program Studi and Pegawai UPK only", () => {
    const openers: RoleId[] = [
      "head_of_unit",
      "director",
      "head_of_program",
      "upk_staff",
    ];
    for (const role of ROLE_IDS) {
      expect(mayOpenTab([role], "mentors", "student_survey")).toBe(
        openers.includes(role),
      );
    }
  });

  it("refuses the tab Evaluasi oleh mahasiswa to Pengasuh and Mahasiswa, alone or together", () => {
    expect(mayOpenTab(["mentor"], "mentors", "student_survey")).toBe(false);
    expect(mayOpenTab(["student"], "mentors", "student_survey")).toBe(false);
    expect(mayOpenTab(["mentor", "student"], "mentors", "student_survey")).toBe(
      false,
    );
  });

  it("gives no survey period to manage to an account whose roles only read the tab", () => {
    expect(may(["head_of_program", "upk_staff"], "manage_survey_periods")).toBe(
      false,
    );
  });

  it("lets every role that sees the evaluations of mentors see the groups and the mentors they are shown with", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "view_mentor_evaluations")) continue;
      expect(may([role], "view_mentor_groups")).toBe(true);
      expect(may([role], "view_mentors")).toBe(true);
    }
  });

  const noteReaders: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
  ];

  it.each(noteReaders)("lets %s read mentoring notes", (role) => {
    expect(may([role], "view_mentoring_notes")).toBe(true);
  });

  it("refuses every other role to read mentoring notes, Pegawai UPK and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => !noteReaders.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - noteReaders.length);
    expect(others).toContain("upk_staff");
    expect(others).toContain("student");
    expect(others).toContain("counsellor");
    for (const role of others) {
      expect(may([role], "view_mentoring_notes")).toBe(false);
    }
  });

  it("gives the right to read mentoring notes to every role with the tab Catatan pendampingan", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_mentoring_notes")).toBe(
        mayOpenTab([role], "mentoring", "notes"),
      );
    }
  });

  it("lets Pengasuh write a mentoring note", () => {
    expect(may(["mentor"], "write_mentoring_notes")).toBe(true);
  });

  it("refuses every other role to write a mentoring note, Kepala Unit among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "mentor");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    expect(others).toContain("head_of_unit");
    expect(others).toContain("head_of_program");
    for (const role of others) {
      expect(may([role], "write_mentoring_notes")).toBe(false);
    }
  });

  it("lets every role that may write a mentoring note read the notes", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "write_mentoring_notes")) continue;
      expect(may([role], "view_mentoring_notes")).toBe(true);
    }
  });

  const attendanceReaders: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
  ];

  it.each(attendanceReaders)(
    "lets %s read the attendance of mentoring meetings",
    (role) => {
      expect(may([role], "view_mentoring_attendance")).toBe(true);
    },
  );

  it("refuses every other role to read the attendance of mentoring meetings, Pegawai UPK and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => !attendanceReaders.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - attendanceReaders.length);
    expect(others).toContain("upk_staff");
    expect(others).toContain("student");
    expect(others).toContain("assessor");
    for (const role of others) {
      expect(may([role], "view_mentoring_attendance")).toBe(false);
    }
  });

  it("gives the right to read attendance to every role with the tab Pertemuan dan daftar hadir", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_mentoring_attendance")).toBe(
        mayOpenTab([role], "mentoring", "meetings"),
      );
    }
  });

  it("lets Pengasuh fill in an attendance list", () => {
    expect(may(["mentor"], "fill_mentoring_attendance")).toBe(true);
  });

  it("refuses every other role to fill in an attendance list, Kepala Unit among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "mentor");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    expect(others).toContain("head_of_unit");
    expect(others).toContain("head_of_program");
    for (const role of others) {
      expect(may([role], "fill_mentoring_attendance")).toBe(false);
    }
  });

  it("lets every role that may fill in an attendance list read attendance", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "fill_mentoring_attendance")) continue;
      expect(may([role], "view_mentoring_attendance")).toBe(true);
    }
  });

  const scoreReaders: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
  ];

  it.each(scoreReaders)("lets %s read the mentoring scores", (role) => {
    expect(may([role], "view_mentoring_scores")).toBe(true);
  });

  it("refuses every other role to read the mentoring scores, Pegawai UPK and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => !scoreReaders.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - scoreReaders.length);
    expect(others).toContain("upk_staff");
    expect(others).toContain("student");
    expect(others).toContain("assessor");
    for (const role of others) {
      expect(may([role], "view_mentoring_scores")).toBe(false);
    }
  });

  it("gives the right to read mentoring scores to every role with the tab Nilai pengasuhan", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_mentoring_scores")).toBe(
        mayOpenTab([role], "mentoring", "scores"),
      );
    }
  });

  it("lets Pengasuh give a mentoring score", () => {
    expect(may(["mentor"], "give_mentoring_scores")).toBe(true);
  });

  it("refuses every other role to give a mentoring score, Kepala Unit among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "mentor");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    expect(others).toContain("head_of_unit");
    expect(others).toContain("head_of_program");
    for (const role of others) {
      expect(may([role], "give_mentoring_scores")).toBe(false);
    }
  });

  it("lets every role that may give a mentoring score read the scores", () => {
    for (const role of ROLE_IDS) {
      if (!may([role], "give_mentoring_scores")) continue;
      expect(may([role], "view_mentoring_scores")).toBe(true);
    }
  });

  it("lets Mahasiswa read their own student record", () => {
    expect(may(["student"], "view_own_profile")).toBe(true);
    expect(mayOpenPage(["student"], "profile")).toBe(true);
  });

  it("refuses every other role to read their own student record", () => {
    const others = ROLE_IDS.filter((role) => role !== "student");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "view_own_profile")).toBe(false);
    }
  });

  it.each(["head_of_unit", "mentor", "bam_bphk"] as const)(
    "refuses %s to read their own student record and to open Profil saya",
    (role) => {
      expect(may([role], "view_own_profile")).toBe(false);
      expect(mayOpenPage([role], "profile")).toBe(false);
    },
  );

  it("gives the right to read one's own student record to every role with Profil saya", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_own_profile")).toBe(
        mayOpenPage([role], "profile"),
      );
    }
  });

  it("gives Mahasiswa no right that changes a student record", () => {
    expect(ROLES.student.actions).toEqual([
      "view_own_profile",
      "send_attendance_photo",
      "view_own_dorm_activities",
      "view_own_dorm_attendance",
      "ask_dorm_leave",
    ]);
    expect(may(["student"], "input_new_students")).toBe(false);
  });

  it("lets Mahasiswa send an attendance photo, on Kegiatan karakter", () => {
    expect(may(["student"], "send_attendance_photo")).toBe(true);
    expect(mayOpenPage(["student"], "activities")).toBe(true);
  });

  it("refuses every other role to send an attendance photo", () => {
    const others = ROLE_IDS.filter((role) => role !== "student");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(may([role], "send_attendance_photo")).toBe(false);
    }
  });

  it("lets Pegawai UPK verify attendance, under the name Verifikasi presensi", () => {
    expect(may(["upk_staff"], "verify_attendance")).toBe(true);
    expect(ACTION_TITLES.verify_attendance).toBe("Verifikasi presensi");
  });

  it("refuses every other role to verify attendance, Kepala Unit and Penilai Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "upk_staff");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    expect(others).toContain("head_of_unit");
    expect(others).toContain("assessor");
    for (const role of others) {
      expect(may([role], "verify_attendance")).toBe(false);
    }
  });

  it("lets Penilai Mahasiswa decide clarifications of character activities, under the name of the prototype's list of rights", () => {
    expect(may(["assessor"], "decide_activity_clarifications")).toBe(true);
    expect(ACTION_TITLES.decide_activity_clarifications).toBe(
      "Verifikasi dan validasi klarifikasi kegiatan karakter",
    );
  });

  it("refuses every other role to decide clarifications, Kepala Unit, Pegawai UPK and Mahasiswa among them", () => {
    const others = ROLE_IDS.filter((role) => role !== "assessor");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    expect(others).toEqual(
      expect.arrayContaining(["head_of_unit", "upk_staff", "student"]),
    );
    for (const role of others) {
      expect(may([role], "decide_activity_clarifications")).toBe(false);
    }
  });

  it("answers no to an action that is not on the list", () => {
    // An action name that may arrive from outside the typed code.
    const unknown = "delete_everything" as Action;
    expect(may(["head_of_unit"], unknown)).toBe(false);
  });

  it("answers no to an account with no roles", () => {
    expect(may([], "manage_users")).toBe(false);
  });

  it.each(ACTIONS)(
    "has a role that may and a role that may not %s",
    (action) => {
      const allowed = ROLE_IDS.filter((role) => may([role], action));
      expect(allowed.length).toBeGreaterThan(0);
      expect(allowed.length).toBeLessThan(ROLE_IDS.length);
    },
  );
});

describe("pagesFor", () => {
  it("gives a mentor the mentor's pages in menu order", () => {
    expect(paths(pagesFor(["mentor"]))).toEqual([
      "dashboard",
      "kurikulum",
      "kegiatan",
      "pengasuhan",
      "penilaian",
      "pembinaan",
      "asrama",
    ]);
  });

  it("joins the pages of two roles, in menu order, without repeats", () => {
    expect(paths(pagesFor(["counsellor", "discipline_officer"]))).toEqual([
      "penilaian",
      "konseling",
      "pembinaan",
    ]);
  });

  it("gives no pages to an account with no roles", () => {
    expect(pagesFor([])).toEqual([]);
  });

  it("puts Profil saya first for a student, the page they land on", () => {
    expect(pagesFor(["student"])[0]?.path).toBe("saya");
  });

  it.each(BAM_ROLES)(
    "puts Profil saya first for a student who is also %s, with that role's pages after it",
    (role) => {
      const pages = paths(pagesFor(["student", role]));

      expect(pages[0]).toBe("saya");
      expect(pages).toEqual(expect.arrayContaining(paths(pagesFor([role]))));
    },
  );
});

describe("needsDormResident", () => {
  it("opens Asrama to Mahasiswa only for a dorm resident", () => {
    expect(needsDormResident(["student"], "dorm")).toBe(true);
  });

  it("opens the other pages of Mahasiswa to every student", () => {
    for (const page of ROLES.student.pages) {
      if (page === "dorm") continue;
      expect(needsDormResident(["student"], page)).toBe(false);
    }
  });

  it("asks no other role to live in the dorm", () => {
    const others = ROLE_IDS.filter((role) => role !== "student");
    for (const role of others) {
      expect(needsDormResident([role], "dorm")).toBe(false);
    }
  });

  it("opens Asrama to a student who also holds a dorm role", () => {
    expect(needsDormResident(["student", "bam_bphk"], "dorm")).toBe(false);
  });
});

describe("pagesForAccount", () => {
  it("shows Asrama to a student who lives in the dorm", () => {
    expect(paths(pagesForAccount(["student"], true))).toContain("asrama");
  });

  it("hides Asrama from a student who does not live in the dorm", () => {
    expect(paths(pagesForAccount(["student"], false))).toEqual([
      "saya",
      "kegiatan",
      "penilaian",
      "konseling",
    ]);
  });

  it("shows Asrama to a dorm role wherever the account lives", () => {
    expect(paths(pagesForAccount(["dorm_manager"], false))).toContain("asrama");
    expect(
      paths(pagesForAccount(["student", "bam_household"], false)),
    ).toContain("asrama");
  });
});

describe("tabsFor", () => {
  it("gives a role only its own tabs, in the page's order", () => {
    expect(paths(tabsFor(["bam_household"], "dorm"))).toEqual([
      "dash",
      "kegiatan",
      "kamar",
      "bersih",
    ]);
  });

  it("joins the tabs of two roles", () => {
    expect(paths(tabsFor(["counsellor", "assessor"], "assessment"))).toEqual([
      "karakter",
      "asesmen",
      "jasmani",
      "mental",
      "skpm",
      "siku",
    ]);
  });

  it("gives every role that opens Pengasuhan its three tabs, Catatan pendampingan first", () => {
    const openers = ROLE_IDS.filter((role) => mayOpenPage([role], "mentoring"));

    expect(openers).toEqual([
      "head_of_unit",
      "director",
      "head_of_program",
      "mentor",
    ]);
    for (const role of openers) {
      expect(paths(tabsFor([role], "mentoring"))).toEqual([
        "catatan",
        "hadir",
        "nilai",
      ]);
    }
  });

  it("gives Pengguna dan peran only to a role that manages users", () => {
    expect(paths(tabsFor(["head_of_unit"], "settings"))).toContain("pengguna");
    expect(paths(tabsFor(["upk_staff"], "settings"))).toEqual(["mahasiswa"]);
  });

  it("gives Periode akademik to Kepala Unit only", () => {
    expect(paths(tabsFor(["head_of_unit"], "settings"))).toContain("periode");
    const others = ROLE_IDS.filter((role) => role !== "head_of_unit");
    for (const role of others) {
      expect(paths(tabsFor([role], "settings"))).not.toContain("periode");
    }
  });

  const scheduleReaders: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "upk_staff",
  ];

  it.each(scheduleReaders)("gives %s the tab Kegiatan PPKS", (role) => {
    expect(paths(tabsFor([role], "activities"))).toContain("ppks");
    expect(mayOpenTab([role], "activities", "ppks")).toBe(true);
  });

  it.each(scheduleReaders)(
    "gives %s the tab Kegiatan tambahan, right after Kegiatan PPKS",
    (role) => {
      const tabs = paths(tabsFor([role], "activities"));
      expect(tabs.indexOf("tambahan")).toBe(tabs.indexOf("ppks") + 1);
      expect(mayOpenTab([role], "activities", "extra")).toBe(true);
    },
  );

  it("gives Pegawai UPK the tab Verifikasi presensi, as their first tab of Kegiatan karakter", () => {
    expect(paths(tabsFor(["upk_staff"], "activities"))).toEqual([
      "verifikasi",
      "ppks",
      "tambahan",
    ]);
    expect(mayOpenTab(["upk_staff"], "activities", "verification")).toBe(true);
  });

  it("refuses the tab Verifikasi presensi to every other role", () => {
    const others = ROLE_IDS.filter((role) => role !== "upk_staff");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(mayOpenTab([role], "activities", "verification")).toBe(false);
      expect(paths(tabsFor([role], "activities"))).not.toContain("verifikasi");
    }
  });

  it("gives the right to verify attendance to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "verify_attendance")).toBe(
        mayOpenTab([role], "activities", "verification"),
      );
    }
  });

  it("refuses the tabs Kegiatan PPKS and Kegiatan tambahan to every other role", () => {
    const others = ROLE_IDS.filter((role) => !scheduleReaders.includes(role));
    expect(others.length).toBe(ROLE_IDS.length - scheduleReaders.length);
    for (const role of others) {
      expect(mayOpenTab([role], "activities", "ppks")).toBe(false);
      expect(mayOpenTab([role], "activities", "extra")).toBe(false);
    }
  });

  it("leaves Mahasiswa on Kegiatan karakter without a tab: the page itself is theirs", () => {
    expect(mayOpenPage(["student"], "activities")).toBe(true);
    expect(tabsFor(["student"], "activities")).toEqual([]);
    expect(mayOpenTab(["student"], "activities", "ppks")).toBe(false);
  });

  it("gives Penilai Mahasiswa the tab Klarifikasi kehadiran as their only tab of Kegiatan karakter", () => {
    expect(paths(tabsFor(["assessor"], "activities"))).toEqual(["klarifikasi"]);
    expect(mayOpenTab(["assessor"], "activities", "clarification")).toBe(true);
    expect(mayOpenTab(["assessor"], "activities", "ppks")).toBe(false);
  });

  it("refuses the tab Klarifikasi kehadiran to every other role", () => {
    const others = ROLE_IDS.filter((role) => role !== "assessor");
    expect(others.length).toBe(ROLE_IDS.length - 1);
    for (const role of others) {
      expect(mayOpenTab([role], "activities", "clarification")).toBe(false);
      expect(paths(tabsFor([role], "activities"))).not.toContain("klarifikasi");
    }
  });

  it("gives the right to decide clarifications to every role with its tab", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "decide_activity_clarifications")).toBe(
        mayOpenTab([role], "activities", "clarification"),
      );
    }
  });

  it("gives the tab Kegiatan PPKS to every role that may manage activities", () => {
    const managers = ROLE_IDS.filter((role) =>
      may([role], "manage_activities"),
    );

    expect(managers.length).toBeGreaterThan(0);
    for (const role of managers) {
      expect(mayOpenTab([role], "activities", "ppks")).toBe(true);
    }
  });
});

describe("mayOpenPage and mayOpenTab", () => {
  it("lets a role open its own page and refuses another", () => {
    expect(mayOpenPage(["counsellor"], "counselling")).toBe(true);
    expect(mayOpenPage(["counsellor"], "settings")).toBe(false);
  });

  it("refuses a tab of an allowed page that the role does not have", () => {
    expect(mayOpenTab(["upk_staff"], "settings", "new_students")).toBe(true);
    expect(mayOpenTab(["upk_staff"], "settings", "users")).toBe(false);
  });
});

describe("rowLimitForAction and rowLimitForPage", () => {
  const EVERY_ROW = { kind: "all" };

  function account(
    roles: RoleId[],
    studyProgramId: number | null = null,
  ): AccountForAccess {
    return { id: "account-1", roles, studyProgramId, studentId: null };
  }

  function onlyPrograms(studyProgramIds: number[]) {
    return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
  }

  const OWN_MENTEES = {
    kind: "some",
    studyProgramIds: [],
    menteesOf: ["account-1"],
    studentIds: [],
  };

  const NO_ROW = onlyPrograms([]);

  /** The roles that see every student row and may not open a student's detail. */
  const WIDE_WITHOUT_DETAIL = ROLE_IDS.filter(
    (role) => ROLES[role].rows === "all" && !may([role], "view_student_detail"),
  );

  it("gives one role its own rows for an action it allows", () => {
    expect(
      rowLimitForAction(account(["head_of_unit"]), "view_student_detail"),
    ).toEqual(EVERY_ROW);
    expect(
      rowLimitForAction(account(["head_of_program"], 7), "view_student_detail"),
    ).toEqual(onlyPrograms([7]));
  });

  it("gives no row for an action or a page none of the roles allows", () => {
    const staff = account(["upk_staff"]);

    expect(rowLimitForAction(staff, "view_student_detail")).toEqual(NO_ROW);
    expect(rowLimitForPage(staff, "students")).toEqual(NO_ROW);
  });

  it("keeps Ketua Program Studi to their program for the Mahasiswa list and a student's detail, whatever wide role they also hold", () => {
    expect(WIDE_WITHOUT_DETAIL).toEqual(
      expect.arrayContaining([
        "upk_staff",
        "counsellor",
        "assessor",
        "discipline_officer",
        "dorm_manager",
      ]),
    );
    for (const role of WIDE_WITHOUT_DETAIL) {
      const both = account(["head_of_program", role], 7);

      expect(rowLimitForAction(both, "view_student_detail")).toEqual(
        onlyPrograms([7]),
      );
      expect(rowLimitForPage(both, "students")).toEqual(onlyPrograms([7]));
    }
  });

  it("gives Ketua Program Studi who is also Pegawai UPK every group", () => {
    const both = account(["head_of_program", "upk_staff"], 7);

    expect(rowLimitForAction(both, "view_mentor_groups")).toEqual(EVERY_ROW);
  });

  it("keeps Ketua Program Studi who is also Konselor to the groups of their program", () => {
    const both = account(["head_of_program", "counsellor"], 7);

    expect(rowLimitForAction(both, "view_mentor_groups")).toEqual(
      onlyPrograms([7]),
    );
  });

  it("shows the penetapan to Ketua Program Studi for their program only, and none without a program", () => {
    const head = account(["head_of_program"], 7);
    const withoutProgram = account(["head_of_program"]);

    expect(rowLimitForAction(head, "view_cohort_assignments")).toEqual(
      onlyPrograms([7]),
    );
    expect(
      rowLimitForAction(withoutProgram, "view_cohort_assignments"),
    ).toEqual(NO_ROW);
  });

  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "shows %s the penetapan of every program studi",
    (role) => {
      expect(
        rowLimitForAction(account([role]), "view_cohort_assignments"),
      ).toEqual(EVERY_ROW);
    },
  );

  it("gives Ketua Program Studi who is also Pegawai UPK every penetapan, to see and to prepare", () => {
    const both = account(["head_of_program", "upk_staff"], 7);

    expect(rowLimitForAction(both, "view_cohort_assignments")).toEqual(
      EVERY_ROW,
    );
    expect(rowLimitForAction(both, "prepare_cohort_assignments")).toEqual(
      EVERY_ROW,
    );
  });

  it("shows the evaluations of mentors to Ketua Program Studi for their program only, and none without a program", () => {
    const head = account(["head_of_program"], 7);
    const withoutProgram = account(["head_of_program"]);

    expect(rowLimitForAction(head, "view_mentor_evaluations")).toEqual(
      onlyPrograms([7]),
    );
    expect(
      rowLimitForAction(withoutProgram, "view_mentor_evaluations"),
    ).toEqual(NO_ROW);
  });

  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "shows %s the evaluations of mentors of every program studi",
    (role) => {
      expect(
        rowLimitForAction(account([role]), "view_mentor_evaluations"),
      ).toEqual(EVERY_ROW);
    },
  );

  it("keeps Ketua Program Studi who is also Konselor or Pengasuh to the evaluations of their program", () => {
    for (const other of ["counsellor", "mentor"] as const) {
      const both = account(["head_of_program", other], 7);

      expect(rowLimitForAction(both, "view_mentor_evaluations")).toEqual(
        onlyPrograms([7]),
      );
    }
  });

  it("gives no row to evaluate to an account whose roles may not evaluate", () => {
    const both = account(["head_of_program", "upk_staff"], 7);

    expect(rowLimitForAction(both, "evaluate_mentors")).toEqual(NO_ROW);
    expect(
      rowLimitForAction(account(["head_of_unit"]), "evaluate_mentors"),
    ).toEqual(EVERY_ROW);
  });

  it("gives no group to replace the mentor of to an account whose roles may not replace", () => {
    const both = account(["head_of_program", "upk_staff"], 7);

    expect(rowLimitForAction(both, "replace_mentors")).toEqual(NO_ROW);
    expect(
      rowLimitForAction(account(["head_of_unit"]), "replace_mentors"),
    ).toEqual(EVERY_ROW);
  });

  it.each([
    "view_dorm_rooms",
    "view_dorm_companions",
    "view_dorm_activities",
    "view_dorm_attendance",
    "view_dorm_leave",
  ] as const)(
    "keeps Ketua Program Studi who is also Konselor to their program for %s",
    (action) => {
      const both = account(["head_of_program", "counsellor"], 7);

      expect(rowLimitForAction(both, action)).toEqual(onlyPrograms([7]));
    },
  );

  it.each([
    "view_dorm_rooms",
    "view_dorm_companions",
    "view_dorm_activities",
    "view_dorm_attendance",
    "view_dorm_leave",
  ] as const)("joins the rows of two roles that both allow %s", (action) => {
    const both = account(["head_of_program", "dorm_manager"], 7);

    expect(rowLimitForAction(both, action)).toEqual(EVERY_ROW);
  });

  it("joins the rows of two roles that both open a page", () => {
    const both = account(["mentor", "head_of_program"], 3);

    expect(rowLimitForPage(both, "mentoring")).toEqual({
      ...OWN_MENTEES,
      studyProgramIds: [3],
    });
  });

  it("keeps Pengasuh to their mentees on a page only Pengasuh opens, whatever wide role they also hold", () => {
    const wideWithoutPage = ROLE_IDS.filter(
      (role) => ROLES[role].rows === "all" && !mayOpenPage([role], "mentoring"),
    );

    expect(wideWithoutPage).toContain("assessor");
    for (const role of wideWithoutPage) {
      const both = account(["mentor", role]);

      expect(rowLimitForPage(both, "mentoring")).toEqual(OWN_MENTEES);
    }
  });

  it("gives each role that reads mentoring notes the notes of its own rows", () => {
    const action = "view_mentoring_notes";

    expect(rowLimitForAction(account(["head_of_unit"]), action)).toEqual(
      EVERY_ROW,
    );
    expect(rowLimitForAction(account(["director"]), action)).toEqual(EVERY_ROW);
    expect(rowLimitForAction(account(["head_of_program"], 7), action)).toEqual(
      onlyPrograms([7]),
    );
    expect(rowLimitForAction(account(["mentor"]), action)).toEqual(OWN_MENTEES);
  });

  it("joins the notes of Pengasuh who is also Ketua Program Studi: own mentees and own program", () => {
    const both = account(["mentor", "head_of_program"], 3);

    expect(rowLimitForAction(both, "view_mentoring_notes")).toEqual({
      ...OWN_MENTEES,
      studyProgramIds: [3],
    });
  });

  it("keeps Pengasuh to the notes of their mentees, whatever wide role without the notes they also hold", () => {
    const wideWithoutNotes = ROLE_IDS.filter(
      (role) =>
        ROLES[role].rows === "all" && !may([role], "view_mentoring_notes"),
    );

    expect(wideWithoutNotes).toEqual(
      expect.arrayContaining(["upk_staff", "counsellor", "dorm_manager"]),
    );
    for (const role of wideWithoutNotes) {
      const both = account(["mentor", role]);

      expect(rowLimitForAction(both, "view_mentoring_notes")).toEqual(
        OWN_MENTEES,
      );
      expect(rowLimitForAction(both, "write_mentoring_notes")).toEqual(
        OWN_MENTEES,
      );
    }
  });

  it("gives no row to write a note for to an account that is not Pengasuh, whatever it reads", () => {
    const readers = account(["head_of_unit", "director", "head_of_program"], 7);

    expect(rowLimitForAction(readers, "write_mentoring_notes")).toEqual(NO_ROW);
  });

  it("lets Pengasuh who is also Kepala Unit write only for their own mentees", () => {
    const both = account(["mentor", "head_of_unit"]);

    expect(rowLimitForAction(both, "view_mentoring_notes")).toEqual(EVERY_ROW);
    expect(rowLimitForAction(both, "write_mentoring_notes")).toEqual(
      OWN_MENTEES,
    );
  });

  it("gives each role that reads attendance the meetings of its own rows", () => {
    const action = "view_mentoring_attendance";

    expect(rowLimitForAction(account(["head_of_unit"]), action)).toEqual(
      EVERY_ROW,
    );
    expect(rowLimitForAction(account(["director"]), action)).toEqual(EVERY_ROW);
    expect(rowLimitForAction(account(["head_of_program"], 7), action)).toEqual(
      onlyPrograms([7]),
    );
    expect(rowLimitForAction(account(["mentor"]), action)).toEqual(OWN_MENTEES);
  });

  it("keeps Pengasuh to the attendance of their own groups, whatever wide role without it they also hold", () => {
    const wideWithoutAttendance = ROLE_IDS.filter(
      (role) =>
        ROLES[role].rows === "all" && !may([role], "view_mentoring_attendance"),
    );

    expect(wideWithoutAttendance).toEqual(
      expect.arrayContaining(["upk_staff", "counsellor", "assessor"]),
    );
    for (const role of wideWithoutAttendance) {
      const both = account(["mentor", role]);

      expect(rowLimitForAction(both, "view_mentoring_attendance")).toEqual(
        OWN_MENTEES,
      );
      expect(rowLimitForAction(both, "fill_mentoring_attendance")).toEqual(
        OWN_MENTEES,
      );
    }
  });

  it("gives no group to fill in to an account that is not Pengasuh, whatever it reads", () => {
    const readers = account(["head_of_unit", "director", "head_of_program"], 7);

    expect(rowLimitForAction(readers, "fill_mentoring_attendance")).toEqual(
      NO_ROW,
    );
  });

  it("lets Pengasuh who is also Kepala Unit read every group and fill in only their own", () => {
    const both = account(["mentor", "head_of_unit"]);

    expect(rowLimitForAction(both, "view_mentoring_attendance")).toEqual(
      EVERY_ROW,
    );
    expect(rowLimitForAction(both, "fill_mentoring_attendance")).toEqual(
      OWN_MENTEES,
    );
  });

  it("gives each role that reads mentoring scores the scores of its own rows", () => {
    const action = "view_mentoring_scores";

    expect(rowLimitForAction(account(["head_of_unit"]), action)).toEqual(
      EVERY_ROW,
    );
    expect(rowLimitForAction(account(["director"]), action)).toEqual(EVERY_ROW);
    expect(rowLimitForAction(account(["head_of_program"], 7), action)).toEqual(
      onlyPrograms([7]),
    );
    expect(rowLimitForAction(account(["mentor"]), action)).toEqual(OWN_MENTEES);
  });

  it("keeps Pengasuh to the scores of their own groups, whatever wide role without them they also hold", () => {
    const wideWithoutScores = ROLE_IDS.filter(
      (role) =>
        ROLES[role].rows === "all" && !may([role], "view_mentoring_scores"),
    );

    expect(wideWithoutScores).toEqual(
      expect.arrayContaining(["upk_staff", "counsellor", "assessor"]),
    );
    for (const role of wideWithoutScores) {
      const both = account(["mentor", role]);

      expect(rowLimitForAction(both, "view_mentoring_scores")).toEqual(
        OWN_MENTEES,
      );
      expect(rowLimitForAction(both, "give_mentoring_scores")).toEqual(
        OWN_MENTEES,
      );
    }
  });

  it("gives no group to score to an account that is not Pengasuh, whatever it reads", () => {
    const readers = account(["head_of_unit", "director", "head_of_program"], 7);

    expect(rowLimitForAction(readers, "give_mentoring_scores")).toEqual(NO_ROW);
  });

  it("lets Pengasuh who is also Kepala Unit read the scores of every group and give them only in their own", () => {
    const both = account(["mentor", "head_of_unit"]);

    expect(rowLimitForAction(both, "view_mentoring_scores")).toEqual(EVERY_ROW);
    expect(rowLimitForAction(both, "give_mentoring_scores")).toEqual(
      OWN_MENTEES,
    );
  });

  it("lets a role that sees every row win over a limited one on a page both open", () => {
    const both = account(["mentor", "assessor"]);

    expect(rowLimitForPage(both, "assessment")).toEqual(EVERY_ROW);
  });

  it("shows Ketua Program Studi with no program nothing", () => {
    const head = account(["head_of_program"]);

    expect(rowLimitForPage(head, "students")).toEqual(NO_ROW);
    expect(rowLimitForAction(head, "view_student_detail")).toEqual(NO_ROW);
  });

  it("keeps a student to their own record on Profil saya, whatever wide role they also hold", () => {
    const wideRoles = ROLE_IDS.filter((role) => ROLES[role].rows === "all");
    const onlyThemselves = { ...NO_ROW, studentIds: ["student-1"] };

    expect(wideRoles).toEqual(
      expect.arrayContaining(["bam_bphk", "head_of_unit", "dorm_manager"]),
    );
    for (const role of wideRoles) {
      const both = { ...account(["student", role]), studentId: "student-1" };

      expect(rowLimitForAction(both, "view_own_profile")).toEqual(
        onlyThemselves,
      );
    }
  });

  it("gives a wide role no row on Profil saya, even with a student record", () => {
    const staff = { ...account(["head_of_unit"]), studentId: "student-1" };

    expect(rowLimitForAction(staff, "view_own_profile")).toEqual(NO_ROW);
  });

  it("keeps a student to their own attendance, whatever wide role they also hold", () => {
    const both = {
      ...account(["student", "head_of_unit"]),
      studentId: "student-1",
    };
    const staff = { ...account(["upk_staff"]), studentId: "student-1" };

    expect(rowLimitForAction(both, "send_attendance_photo")).toEqual({
      ...NO_ROW,
      studentIds: ["student-1"],
    });
    expect(rowLimitForAction(staff, "send_attendance_photo")).toEqual(NO_ROW);
  });

  it("shows an account with no roles nothing", () => {
    expect(rowLimitForPage(account([]), "students")).toEqual(NO_ROW);
    expect(rowLimitForAction(account([]), "view_dorm_rooms")).toEqual(NO_ROW);
  });

  it("gives every single role the rows of its own rule, for each of its actions and pages", () => {
    const rowsOfRule = {
      all: EVERY_ROW,
      own_program: onlyPrograms([7]),
      own_mentees: OWN_MENTEES,
      self: { ...NO_ROW, studentIds: ["student-1"] },
    };
    for (const role of ROLE_IDS) {
      const alone = { ...account([role], 7), studentId: "student-1" };
      const own = rowsOfRule[ROLES[role].rows];

      for (const action of ROLES[role].actions) {
        expect(rowLimitForAction(alone, action)).toEqual(own);
      }
      for (const page of ROLES[role].pages) {
        expect(rowLimitForPage(alone, page)).toEqual(own);
      }
    }
  });

  it("shows the attendance on Kegiatan PPKS to Ketua Program Studi for their program and to Pengasuh for their mentees only", () => {
    expect(
      rowLimitForTab(account(["head_of_program"], 7), "activities", "ppks"),
    ).toEqual(onlyPrograms([7]));
    expect(rowLimitForTab(account(["mentor"]), "activities", "ppks")).toEqual(
      OWN_MENTEES,
    );
  });

  it.each(["head_of_unit", "director", "upk_staff"] as const)(
    "shows %s the attendance on Kegiatan PPKS of every student",
    (role) => {
      expect(rowLimitForTab(account([role]), "activities", "ppks")).toEqual(
        EVERY_ROW,
      );
    },
  );

  it("keeps Ketua Program Studi to their program on Kegiatan PPKS when their other role opens Kegiatan karakter but not that tab", () => {
    const both = account(["head_of_program", "assessor"], 7);

    expect(rowLimitForPage(both, "activities")).toEqual(EVERY_ROW);
    expect(rowLimitForTab(both, "activities", "ppks")).toEqual(
      onlyPrograms([7]),
    );
  });

  it("gives no row on a tab to a role that does not open it", () => {
    expect(rowLimitForTab(account(["assessor"]), "activities", "ppks")).toEqual(
      NO_ROW,
    );
    expect(
      rowLimitForTab(account(["upk_staff"]), "activities", "tidak-ada"),
    ).toEqual(NO_ROW);
  });

  it("gives an account the rows of every role that opens the tab", () => {
    const both = account(["head_of_program", "upk_staff"], 7);

    expect(rowLimitForTab(both, "activities", "ppks")).toEqual(EVERY_ROW);
  });
});

describe("the permission list", () => {
  const pageIds: string[] = PAGES.map((page) => page.id);

  it.each(ROLE_IDS)("gives %s only pages that exist", (role) => {
    for (const page of ROLES[role].pages) {
      expect(pageIds).toContain(page);
    }
  });

  /**
   * The pages a role opens while none of their tabs is for that role.
   * Mahasiswa sees their own activities on Kegiatan karakter itself,
   * without a tab.
   */
  const NO_TAB_YET: Partial<Record<RoleId, string[]>> = {
    student: ["activities"],
  };

  it.each(ROLE_IDS)(
    "gives %s at least one tab on each tabbed page it opens, but for a page whose tab for it is not built yet",
    (role) => {
      for (const page of pagesFor([role])) {
        if (!("tabs" in page)) continue;
        const tabs = tabsFor([role], page.id);
        if (NO_TAB_YET[role]?.includes(page.id)) {
          expect(tabs).toEqual([]);
          continue;
        }
        expect(tabs.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(ROLE_IDS)("gives %s tabs only on pages it opens", (role) => {
    const opened = pagesFor([role]).map((page) => page.id);
    for (const page of PAGES) {
      if (opened.includes(page.id)) continue;
      expect(tabsFor([role], page.id)).toEqual([]);
    }
  });
});
