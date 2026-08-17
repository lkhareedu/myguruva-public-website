/** Visibility + domain constants (CRM option-set ints). */
export const PUBLISHED = 777770002;
export const ACTIVE = 777770000;
export const REVIEW_COMPLETED = 777770004;
export const FEE_TUITION = 777770000;
export const FEE_TOTAL = 777770008;
export const RANK_OVERALL = 777770000;
export const RANK_ENGINEERING = 777770003;

export const publicInstitutionWhere = {} as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function asUuid(value: string | null | undefined): string | null {
  if (!value || !UUID_RE.test(value.trim())) return null;
  return value.trim();
}

/** Prefer CRM slug; fall back to institution UUID so rows without slug still link. */
export function publicSlug(row: {
  wn_slug: string | null | undefined;
  wn_institutionid: string;
}): string {
  return (row.wn_slug && row.wn_slug.trim()) || row.wn_institutionid;
}

export function publicName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed || "Unnamed institution";
}
