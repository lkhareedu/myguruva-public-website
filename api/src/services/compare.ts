import { prisma } from "../prisma.js";
import { ACTIVE, PUBLISHED, RANK_ENGINEERING } from "../lib/gates.js";
import { dec, requireOpt } from "../lib/option-sets.js";
import { overallRanks, tuitionByInstitution, verifiedIds } from "./list.js";

export async function compareInstitutions(slugs: string[]) {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))].slice(0, 4);
  if (unique.length < 2) return { items: [] };

  const verified = await verifiedIds();
  const institutions = await prisma.institution.findMany({
    where: {
      wn_slug: { in: unique },
      wn_publishstatus: PUBLISHED,
      wn_currentstatus: ACTIVE,
    },
  });
  const ordered = unique
    .map((s) => institutions.find((i) => i.wn_slug === s))
    .filter((i): i is NonNullable<typeof i> => !!i && verified.has(i.wn_institutionid));

  const ids = ordered.map((i) => i.wn_institutionid);
  if (!ids.length) return { items: [] };

  const [tuition, ranks, engRankings, programs, placements] = await Promise.all([
    tuitionByInstitution(ids),
    overallRanks(ids),
    prisma.ranking.findMany({
      where: { wn_institution: { in: ids }, wn_category: RANK_ENGINEERING },
      orderBy: { updated_at: "desc" },
    }),
    prisma.institutionCourse.findMany({
      where: { wn_institution: { in: ids } },
      select: { wn_institution: true, wn_totalseats: true },
    }),
    prisma.placementSummary.findMany({
      where: { wn_institution: { in: ids } },
      orderBy: { updated_at: "desc" },
    }),
  ]);

  const engBy = new Map<string, number | null>();
  for (const r of engRankings) {
    if (!r.wn_institution || engBy.has(r.wn_institution)) continue;
    engBy.set(r.wn_institution, r.wn_rank ?? null);
  }
  const seatsBy = new Map<string, number>();
  for (const p of programs) {
    if (!p.wn_institution) continue;
    seatsBy.set(p.wn_institution, (seatsBy.get(p.wn_institution) ?? 0) + (p.wn_totalseats ?? 0));
  }
  const placeBy = new Map<string, (typeof placements)[0]>();
  for (const p of placements) {
    if (!p.wn_institution || placeBy.has(p.wn_institution)) continue;
    placeBy.set(p.wn_institution, p);
  }

  return {
    items: ordered.map((i) => {
      const id = i.wn_institutionid;
      const t = tuition.get(id) ?? { min: null, max: null };
      const place = placeBy.get(id);
      const seats = seatsBy.get(id) ?? 0;
      return {
        id,
        name: i.wn_name!,
        slug: i.wn_slug!,
        logoUrl: i.wn_logourl,
        city: i.wn_city,
        state: i.wn_state,
        institutionType: requireOpt("institutionType", i.wn_institutiontype),
        ownership: requireOpt("ownership", i.wn_ownership),
        establishedYear: i.wn_establishedyear,
        naacGrade: requireOpt("naacGrade", i.wn_naacgrade),
        latestOverallRank: ranks.get(id) ?? null,
        latestEngineeringRank: engBy.get(id) ?? null,
        tuitionMin: t.min,
        tuitionMax: t.max,
        totalSeatsSum: seats || null,
        placementPct: place ? dec(place.wn_placementpct) : null,
        avgPackage: place
          ? (dec(place.wn_averagepackagemin) ??
            dec(place.wn_medianpackage) ??
            dec(place.wn_averagepackagemax))
          : null,
        campusSizeAcres: dec(i.wn_campussizeacres),
        hasWifi: i.wn_haswifi,
        verified: true,
      };
    }),
  };
}
