/** Visibility + domain constants (CRM option-set ints). */
export const PUBLISHED = 777770002;
export const ACTIVE = 777770000;
export const REVIEW_COMPLETED = 777770004;
export const FEE_TUITION = 777770000;
export const FEE_TOTAL = 777770008;
export const RANK_OVERALL = 777770000;
export const RANK_ENGINEERING = 777770003;

export const publicInstitutionWhere = {
  wn_publishstatus: PUBLISHED,
  wn_currentstatus: ACTIVE,
} as const;

/** Prefer CRM slug; fall back to institution UUID so draft rows without slug still link. */
export function publicSlug(row: {
  wn_slug: string | null | undefined;
  wn_institutionid: string;
}): string {
  return (row.wn_slug && row.wn_slug.trim()) || row.wn_institutionid;
}
