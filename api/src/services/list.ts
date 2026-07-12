import { prisma } from "../prisma.js";
import { env } from "../env.js";
import {
  FEE_TOTAL,
  FEE_TUITION,
  PUBLISHED,
  RANK_OVERALL,
  REVIEW_COMPLETED,
  ACTIVE,
  publicSlug,
} from "../lib/gates.js";
import { dec, requireOpt } from "../lib/option-sets.js";
import { buildInstitutionSearchClause } from "../lib/search.js";
import { hasPgTrgm } from "../lib/trgm.js";
import { plainTeaser } from "../lib/plain-text.js";

export type ListFilters = {
  q?: string;
  state?: string;
  city?: string;
  institutionType?: number;
  ownership?: number;
  naacGrade?: number;
  stream?: string;
  degreeLevel?: number;
  feeMin?: number;
  feeMax?: number;
  rankBand?: string;
  verified?: boolean;
  featured?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "rank" | "fees" | "name";
};

type IdRow = { id: string };
type CountRow = { c: number };

let verifiedCache: { at: number; ids: Set<string> } | null = null;
const VERIFIED_TTL_MS = 60_000;

export async function verifiedIds(): Promise<Set<string>> {
  if (verifiedCache && Date.now() - verifiedCache.at < VERIFIED_TTL_MS) {
    return verifiedCache.ids;
  }
  const rows = await prisma.institutionReview.findMany({
    where: { wn_reviewstatus: REVIEW_COMPLETED, wn_institution: { not: null } },
    select: { wn_institution: true },
    distinct: ["wn_institution"],
  });
  const ids = new Set(rows.map((r) => r.wn_institution!).filter(Boolean));
  verifiedCache = { at: Date.now(), ids };
  return ids;
}

/** Cheap single-institution verified check (avoids loading the full review set). */
export async function isInstitutionVerified(institutionId: string): Promise<boolean> {
  if (verifiedCache && Date.now() - verifiedCache.at < VERIFIED_TTL_MS) {
    return verifiedCache.ids.has(institutionId);
  }
  const row = await prisma.institutionReview.findFirst({
    where: {
      wn_institution: institutionId,
      wn_reviewstatus: REVIEW_COMPLETED,
    },
    select: { wn_institutionreviewid: true },
  });
  return !!row;
}

export async function tuitionByInstitution(
  ids: string[],
): Promise<Map<string, { min: number | null; max: number | null }>> {
  if (!ids.length) return new Map();
  const fees = await prisma.feeStructure.findMany({
    where: {
      wn_institution: { in: ids },
      wn_feecategory: { in: [FEE_TUITION, FEE_TOTAL] },
    },
    select: {
      wn_institution: true,
      wn_feecategory: true,
      wn_amountmin: true,
      wn_amountmax: true,
    },
  });
  const map = new Map<string, { min: number | null; max: number | null }>();
  for (const id of ids) map.set(id, { min: null, max: null });
  for (const f of fees) {
    const id = f.wn_institution;
    if (!id) continue;
    const cur = map.get(id) ?? { min: null, max: null };
    const amin = dec(f.wn_amountmin);
    const amax = dec(f.wn_amountmax);
    const prefer = f.wn_feecategory === FEE_TUITION;
    if (prefer || cur.min == null) {
      if (amin != null) cur.min = cur.min == null ? amin : Math.min(cur.min, amin);
      if (amax != null) cur.max = cur.max == null ? amax : Math.max(cur.max, amax);
    }
    map.set(id, cur);
  }
  return map;
}

export async function overallRanks(ids: string[]): Promise<Map<string, number | null>> {
  if (!ids.length) return new Map();
  const rankings = await prisma.ranking.findMany({
    where: { wn_institution: { in: ids }, wn_category: RANK_OVERALL },
    select: { wn_institution: true, wn_rank: true, updated_at: true },
    orderBy: { updated_at: "desc" },
  });
  const map = new Map<string, number | null>();
  for (const id of ids) map.set(id, null);
  for (const r of rankings) {
    const id = r.wn_institution;
    if (!id || map.get(id) != null) continue;
    map.set(id, r.wn_rank ?? null);
  }
  return map;
}

async function buildListWhere(f: ListFilters): Promise<{
  conditions: string[];
  params: unknown[];
}> {
  const conditions: string[] = ["i.wn_name IS NOT NULL"];
  if (!env.relaxPublicGates) {
    conditions.push(`i.wn_publishstatus = ${PUBLISHED}`);
    conditions.push(`i.wn_currentstatus = ${ACTIVE}`);
    conditions.push(`i.wn_slug IS NOT NULL`);
  }
  const params: unknown[] = [];
  let p = 1;

  if (f.q?.trim()) {
    const clause = buildInstitutionSearchClause(f.q, p, {
      includeDescription: true,
      useTrgm: await hasPgTrgm(),
    });
    if (clause) {
      conditions.push(clause.sql);
      params.push(...clause.params);
      p = clause.nextParam;
    }
  }
  if (f.state) {
    conditions.push(`lower(i.wn_state) = lower($${p})`);
    params.push(f.state);
    p++;
  }
  if (f.city) {
    conditions.push(`lower(i.wn_city) = lower($${p})`);
    params.push(f.city);
    p++;
  }
  if (f.institutionType != null) {
    conditions.push(`i.wn_institutiontype = $${p}`);
    params.push(f.institutionType);
    p++;
  }
  if (f.ownership != null) {
    conditions.push(`i.wn_ownership = $${p}`);
    params.push(f.ownership);
    p++;
  }
  if (f.naacGrade != null) {
    conditions.push(`i.wn_naacgrade = $${p}`);
    params.push(f.naacGrade);
    p++;
  }
  if (f.featured) conditions.push(`i.wn_isfeatured = true`);
  if (f.verified) {
    conditions.push(`EXISTS (
      SELECT 1 FROM institution_review r
      WHERE r.wn_institution = i.wn_institutionid AND r.wn_reviewstatus = ${REVIEW_COMPLETED}
    )`);
  }
  if (f.stream) {
    conditions.push(`EXISTS (
      SELECT 1 FROM institution_courses ic
      LEFT JOIN streams s ON s.wn_streamid = ic.wn_stream
      WHERE ic.wn_institution = i.wn_institutionid
        AND (lower(s.wn_name) = lower($${p}) OR lower(s.wn_slug) = lower($${p}))
    )`);
    params.push(f.stream);
    p++;
  }
  if (f.degreeLevel != null) {
    conditions.push(`EXISTS (
      SELECT 1 FROM institution_courses ic
      JOIN courses c ON c.wn_courseid = ic.wn_course
      WHERE ic.wn_institution = i.wn_institutionid AND c.wn_degreelevel = $${p}
    )`);
    params.push(f.degreeLevel);
    p++;
  }
  if (f.rankBand) {
    conditions.push(`EXISTS (
      SELECT 1 FROM ranking rk
      WHERE rk.wn_institution = i.wn_institutionid AND rk.wn_rankband = $${p}
    )`);
    params.push(f.rankBand);
    p++;
  }
  if (f.feeMin != null || f.feeMax != null) {
    const feeParts: string[] = [];
    if (f.feeMin != null) {
      feeParts.push(`coalesce(fs.wn_amountmax, fs.wn_amountmin) >= $${p}`);
      params.push(f.feeMin);
      p++;
    }
    if (f.feeMax != null) {
      feeParts.push(`coalesce(fs.wn_amountmin, fs.wn_amountmax) <= $${p}`);
      params.push(f.feeMax);
      p++;
    }
    conditions.push(`EXISTS (
      SELECT 1 FROM fee_structure fs
      WHERE fs.wn_institution = i.wn_institutionid
        AND fs.wn_feecategory IN (${FEE_TUITION}, ${FEE_TOTAL})
        AND ${feeParts.join(" AND ")}
    )`);
  }

  return { conditions, params };
}

function orderBySql(sort: ListFilters["sort"]): string {
  switch (sort) {
    case "name":
      return `i.wn_name ASC NULLS LAST`;
    case "rank":
      return `(
        SELECT rk.wn_rank FROM ranking rk
        WHERE rk.wn_institution = i.wn_institutionid AND rk.wn_category = ${RANK_OVERALL}
        ORDER BY rk.updated_at DESC NULLS LAST
        LIMIT 1
      ) ASC NULLS LAST, i.wn_name ASC`;
    case "fees":
      return `(
        SELECT coalesce(fs.wn_amountmin, fs.wn_amountmax) FROM fee_structure fs
        WHERE fs.wn_institution = i.wn_institutionid
          AND fs.wn_feecategory IN (${FEE_TUITION}, ${FEE_TOTAL})
        ORDER BY CASE WHEN fs.wn_feecategory = ${FEE_TUITION} THEN 0 ELSE 1 END,
                 coalesce(fs.wn_amountmin, fs.wn_amountmax) ASC NULLS LAST
        LIMIT 1
      ) ASC NULLS LAST, i.wn_name ASC`;
    case "relevance":
    default:
      return `i.wn_isfeatured DESC NULLS LAST, i.wn_name ASC`;
  }
}

export async function listInstitutions(f: ListFilters = {}) {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, f.pageSize ?? 24));
  const sort = f.sort ?? "relevance";

  const { conditions, params } = await buildListWhere(f);
  const whereSql = conditions.join(" AND ");

  const countRows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*)::int AS c FROM institutions i WHERE ${whereSql}`,
    ...params,
  );
  const total = countRows[0]?.c ?? 0;
  if (!total) return { items: [], page, pageSize, total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  const idRows = await prisma.$queryRawUnsafe<IdRow[]>(
    `SELECT i.wn_institutionid AS id
     FROM institutions i
     WHERE ${whereSql}
     ORDER BY ${orderBySql(sort)}
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    ...params,
    pageSize,
    offset,
  );
  const ids = idRows.map((r) => r.id);
  if (!ids.length) return { items: [], page: safePage, pageSize, total };

  const [verified, tuition, ranks, institutions] = await Promise.all([
    verifiedIds(),
    tuitionByInstitution(ids),
    overallRanks(ids),
    prisma.institution.findMany({ where: { wn_institutionid: { in: ids } } }),
  ]);
  const byId = new Map(institutions.map((i) => [i.wn_institutionid, i]));

  const items = ids
    .map((id) => {
      const i = byId.get(id);
      if (!i?.wn_name) return null;
      const t = tuition.get(id) ?? { min: null, max: null };
      return {
        id: i.wn_institutionid,
        name: i.wn_name,
        slug: publicSlug(i),
        shortDescription: plainTeaser(i.wn_shortdescription, 160),
        logoUrl: i.wn_logourl,
        coverImageUrl: i.wn_coverimageurl,
        city: i.wn_city,
        state: i.wn_state,
        institutionType: requireOpt("institutionType", i.wn_institutiontype),
        ownership: requireOpt("ownership", i.wn_ownership),
        naacGrade: requireOpt("naacGrade", i.wn_naacgrade),
        establishedYear: i.wn_establishedyear,
        isFeatured: !!i.wn_isfeatured,
        verified: verified.has(id),
        tuitionMin: t.min,
        tuitionMax: t.max,
        latestOverallRank: ranks.get(id) ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  return { items, page: safePage, pageSize, total };
}
