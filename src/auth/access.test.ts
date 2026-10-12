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
  tabsFor,
} from "./access";
import { PAGES } from "./pages";
import { ROLE_IDS, type RoleId } from "./role-ids";
import { ACTIONS, type Action, ROLES } from "./roles";

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

  const detailReaders: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
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

  it.each(["mentor", "upk_staff", "student"] as const)(
    "refuses %s to read a student's detail",
    (role) => {
      expect(may([role], "view_student_detail")).toBe(false);
    },
  );

  it("gives the right to read a student's detail to every role with Mahasiswa", () => {
    for (const role of ROLE_IDS) {
      expect(may([role], "view_student_detail")).toBe(
        mayOpenPage([role], "students"),
      );
    }
  });

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

  it.each(["view_dorm_rooms", "view_dorm_companions"] as const)(
    "keeps Ketua Program Studi who is also Konselor to their program for %s",
    (action) => {
      const both = account(["head_of_program", "counsellor"], 7);

      expect(rowLimitForAction(both, action)).toEqual(onlyPrograms([7]));
    },
  );

  it.each(["view_dorm_rooms", "view_dorm_companions"] as const)(
    "joins the rows of two roles that both allow %s",
    (action) => {
      const both = account(["head_of_program", "dorm_manager"], 7);

      expect(rowLimitForAction(both, action)).toEqual(EVERY_ROW);
    },
  );

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

  it("lets a role that sees every row win over a limited one on a page both open", () => {
    const both = account(["mentor", "assessor"]);

    expect(rowLimitForPage(both, "assessment")).toEqual(EVERY_ROW);
  });

  it("shows Ketua Program Studi with no program nothing", () => {
    const head = account(["head_of_program"]);

    expect(rowLimitForPage(head, "students")).toEqual(NO_ROW);
    expect(rowLimitForAction(head, "view_student_detail")).toEqual(NO_ROW);
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
});

describe("the permission list", () => {
  const pageIds: string[] = PAGES.map((page) => page.id);

  it.each(ROLE_IDS)("gives %s only pages that exist", (role) => {
    for (const page of ROLES[role].pages) {
      expect(pageIds).toContain(page);
    }
  });

  it.each(ROLE_IDS)(
    "gives %s at least one tab on each tabbed page it opens",
    (role) => {
      for (const page of pagesFor([role])) {
        if (!("tabs" in page)) continue;
        expect(tabsFor([role], page.id).length).toBeGreaterThan(0);
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
