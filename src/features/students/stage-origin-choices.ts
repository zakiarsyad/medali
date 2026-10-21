import { STAGES } from "@/academic-periods/stages";
import type { CountedChoice } from "@/ui/counted-select";
import { ORIGIN_AGENCIES, PROVINCES } from "./fixed-lists";
import type { ChoiceCounts } from "./student-choice-counts";
import { NO_AGENCY } from "./student-list-address";

/** The choices of Tahapan, Provinsi and Instansi, each with its count. */

export function stageChoices(counts: ChoiceCounts): CountedChoice[] {
  return STAGES.map((name, place) => {
    const stageNo = place + 1;
    return {
      value: String(stageNo),
      shown: `Tahap ${stageNo} · ${name}`,
      held: counts.stages.get(stageNo) ?? 0,
    };
  });
}

export function provinceChoices(counts: ChoiceCounts): CountedChoice[] {
  return PROVINCES.map((province) => ({
    value: province,
    shown: province,
    held: counts.provinces.get(province) ?? 0,
  }));
}

function agencyChoice(counts: ChoiceCounts, agency: string): CountedChoice {
  return {
    value: agency,
    shown: agency,
    held: counts.agencies.get(agency) ?? 0,
  };
}

export function agencyChoices(counts: ChoiceCounts): CountedChoice[] {
  const none = {
    ...agencyChoice(counts, NO_AGENCY),
    shown: "Tanpa instansi (reguler)",
  };
  const agencies = ORIGIN_AGENCIES.map((agency) =>
    agencyChoice(counts, agency),
  );
  return [none, ...agencies];
}
