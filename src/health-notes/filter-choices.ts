/*
 * How an address names the categories and illnesses a list of sick
 * students is filtered by. Read by the screen parts in the browser, so
 * nothing here may take from the database code.
 */

import type { FitnessCategory } from "./fitness-ids";
import { ILLNESSES, type Illness } from "./health-ids";

/** Each category as an address names it. */
export const CATEGORY_CHOICES: Record<FitnessCategory, string> = {
  excellent: "prima",
  good: "baik",
  attention: "perhatian",
  medical: "medis",
};

/** The illnesses the filter "Riwayat penyakit" offers: every one but Lainnya. */
export const FILTER_ILLNESSES = ILLNESSES.filter(
  (illness) => illness !== "other",
);

/** Each illness of the filter as the address names it. */
export const ILLNESS_CHOICES: Record<Illness, string> = {
  asthma: "asma",
  hypertension: "hipertensi",
  diabetes: "diabetes",
  heart_disease: "jantung",
  gastric_disorder: "lambung",
  allergy: "alergi",
  epilepsy: "epilepsi",
  bone_joint_injury: "cedera",
  infectious_disease: "menular",
  other: "lainnya",
};
