import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { ACTIVE, FEE_TOTAL, FEE_TUITION, PUBLISHED, RANK_ENGINEERING, RANK_OVERALL, publicSlug } from "../lib/gates.js";
import { dec, iso, requireOpt } from "../lib/option-sets.js";
import { isInstitutionVerified } from "./list.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CacheEntry = { at: number; data: unknown };
const detailCache = new Map<string, CacheEntry>();
const DETAIL_TTL_MS = 60_000;

function getCached(slug: string) {
  const hit = detailCache.get(slug);
  if (!hit) return null;
  if (Date.now() - hit.at > DETAIL_TTL_MS) {
    detailCache.delete(slug);
    return null;
  }
  return hit.data;
}

function setCached(slug: string, data: unknown) {
  detailCache.set(slug, { at: Date.now(), data });
  if (detailCache.size > 500) {
    const first = detailCache.keys().next().value;
    if (first) detailCache.delete(first);
  }
}

export async function getInstitutionBySlug(slug: string) {
  const cached = getCached(slug);
  if (cached) return { kind: "detail" as const, data: cached as Awaited<ReturnType<typeof buildDetail>> };

  const gated = !env.relaxPublicGates;
  const publicWhere = gated
    ? { wn_publishstatus: PUBLISHED, wn_currentstatus: ACTIVE }
    : {};

  if (UUID_RE.test(slug)) {
    const byId = await prisma.institution.findFirst({
      where: { ...publicWhere, wn_institutionid: slug },
    });
    if (byId) {
      const data = await buildDetail(byId);
      setCached(slug, data);
      setCached(publicSlug(byId), data);
      return { kind: "detail" as const, data };
    }
  }

  const bySlug = await prisma.institution.findFirst({
    where: { ...publicWhere, wn_slug: slug },
  });

  if (!bySlug) {
    const alias = await prisma.institutionAlias.findFirst({ where: { wn_slug: slug } });
    if (!alias?.wn_institution) return { kind: "notFound" as const };
    const parent = await prisma.institution.findFirst({
      where: { ...publicWhere, wn_institutionid: alias.wn_institution },
    });
    if (!parent) return { kind: "notFound" as const };
    const primary = publicSlug(parent);
    if (alias.wn_redirecttomain) {
      return { kind: "redirect" as const, primarySlug: primary };
    }
    const data = await buildDetail(parent);
    setCached(slug, data);
    setCached(primary, data);
    return { kind: "detail" as const, data };
  }

  const data = await buildDetail(bySlug);
  setCached(slug, data);
  setCached(publicSlug(bySlug), data);
  return { kind: "detail" as const, data };
}

type BundleRow = {
  aliases: unknown;
  schools: unknown;
  programs: unknown;
  rankings: unknown;
  accreditations: unknown;
  approvals: unknown;
  affiliations: unknown;
  exams: unknown;
  gallery: unknown;
  placements: unknown;
  fees: unknown;
  country_name: string | null;
  university_name: string | null;
  tuition_min: unknown;
  tuition_max: unknown;
};

async function buildDetail(i: NonNullable<Awaited<ReturnType<typeof prisma.institution.findFirst>>>) {
  const id = i.wn_institutionid;

  const [verified, bundleRows] = await Promise.all([
    isInstitutionVerified(id),
    prisma.$queryRawUnsafe<BundleRow[]>(
      `
      SELECT
        (SELECT coalesce(json_agg(a), '[]'::json)
           FROM institution_alias a WHERE a.wn_institution = $1::uuid) AS aliases,
        (SELECT coalesce(json_agg(s), '[]'::json)
           FROM schools s WHERE s.wn_institution = $1::uuid) AS schools,
        (SELECT coalesce(json_agg(p), '[]'::json)
           FROM institution_courses p WHERE p.wn_institution = $1::uuid) AS programs,
        (SELECT coalesce(json_agg(r), '[]'::json)
           FROM ranking r WHERE r.wn_institution = $1::uuid) AS rankings,
        (SELECT coalesce(json_agg(ac), '[]'::json)
           FROM accreditation ac WHERE ac.wn_institution = $1::uuid) AS accreditations,
        (SELECT coalesce(json_agg(ap), '[]'::json)
           FROM approval ap WHERE ap.wn_institution = $1::uuid) AS approvals,
        (SELECT coalesce(json_agg(af), '[]'::json)
           FROM affiliation af WHERE af.wn_institution = $1::uuid) AS affiliations,
        (SELECT coalesce(json_agg(e), '[]'::json)
           FROM exam_accepted e WHERE e.wn_institution = $1::uuid) AS exams,
        (SELECT coalesce(json_agg(g), '[]'::json)
           FROM gallery g WHERE g.wn_institution = $1::uuid) AS gallery,
        (SELECT coalesce(json_agg(ps), '[]'::json)
           FROM placement_summary ps WHERE ps.wn_institution = $1::uuid) AS placements,
        (SELECT coalesce(json_agg(fs), '[]'::json)
           FROM fee_structure fs
           WHERE fs.wn_institution = $1::uuid
              OR fs.wn_institutioncourse IN (
                   SELECT ic.wn_institutioncourseid FROM institution_courses ic
                   WHERE ic.wn_institution = $1::uuid
                 )) AS fees,
        (SELECT l.wn_name FROM location l WHERE l.wn_locationid = $2::uuid LIMIT 1) AS country_name,
        (SELECT u.wn_name FROM institutions u WHERE u.wn_institutionid = $3::uuid LIMIT 1) AS university_name,
        (SELECT min(fs.wn_amountmin) FROM fee_structure fs
          WHERE fs.wn_institution = $1::uuid AND fs.wn_feecategory IN (${FEE_TUITION}, ${FEE_TOTAL})) AS tuition_min,
        (SELECT max(coalesce(fs.wn_amountmax, fs.wn_amountmin)) FROM fee_structure fs
          WHERE fs.wn_institution = $1::uuid AND fs.wn_feecategory IN (${FEE_TUITION}, ${FEE_TOTAL})) AS tuition_max
      `,
      id,
      i.wn_country,
      i.wn_affiliateduniversity,
    ),
  ]);

  const b = bundleRows[0] ?? ({} as BundleRow);
  const aliases = asArr(b.aliases);
  const schools = asArr(b.schools);
  const programs = asArr(b.programs);
  const rankings = asArr(b.rankings);
  const accreditations = asArr(b.accreditations);
  const approvals = asArr(b.approvals);
  const affiliations = asArr(b.affiliations);
  const exams = asArr(b.exams);
  const gallery = asArr(b.gallery);
  const placements = asArr(b.placements);
  const fees = asArr(b.fees);

  const streamIds = uniq([
    ...schools.map((s) => s.wn_primarystream).filter(Boolean),
    ...programs.map((p) => p.wn_stream).filter(Boolean),
  ]);
  const courseIds = uniq(programs.map((p) => p.wn_course).filter(Boolean));
  const disciplineIds = uniq(programs.map((p) => p.wn_discipline).filter(Boolean));
  const schoolIds = uniq(programs.map((p) => p.wn_school).filter(Boolean));
  const deptIds = uniq(programs.map((p) => p.wn_department).filter(Boolean));
  const bodyIds = uniq([
    ...rankings.map((r) => r.wn_rankingbody),
    ...accreditations.map((a) => a.wn_regulatorybody),
    ...approvals.map((a) => a.wn_regulatorybody),
  ]);
  const yearIds = uniq([
    ...rankings.map((r) => r.wn_academicyear),
    ...exams.map((e) => e.wn_academicyear),
    ...fees.map((f) => f.wn_academicyear),
  ]);
  const examIds = uniq(exams.map((e) => e.wn_entranceexam).filter(Boolean));
  const uniIds = uniq(affiliations.map((a) => a.wn_university).filter(Boolean));

  const [streams, courses, disciplines, relatedSchools, depts, rankingBodies, regBodies, years, entranceExams, unis, overallRankRows] =
    await Promise.all([
      streamIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM streams WHERE wn_streamid = ANY($1::uuid[])`, streamIds)
        : [],
      courseIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM courses WHERE wn_courseid = ANY($1::uuid[])`, courseIds)
        : [],
      disciplineIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM disciplines WHERE wn_disciplineid = ANY($1::uuid[])`, disciplineIds)
        : [],
      schoolIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM schools WHERE wn_schoolid = ANY($1::uuid[])`, schoolIds)
        : [],
      deptIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM departments WHERE wn_departmentid = ANY($1::uuid[])`, deptIds)
        : [],
      bodyIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ranking_body WHERE wn_rankingbodyid = ANY($1::uuid[])`, bodyIds)
        : [],
      bodyIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM regulatory_body WHERE wn_regulatorybodyid = ANY($1::uuid[])`, bodyIds)
        : [],
      yearIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM academic_year WHERE wn_academicyearid = ANY($1::uuid[])`, yearIds)
        : [],
      examIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT * FROM entrance_exam WHERE wn_entranceexamid = ANY($1::uuid[])`, examIds)
        : [],
      uniIds.length
        ? prisma.$queryRawUnsafe<any[]>(`SELECT wn_institutionid, wn_name FROM institutions WHERE wn_institutionid = ANY($1::uuid[])`, uniIds)
        : [],
      prisma.$queryRawUnsafe<Array<{ wn_rank: number | null }>>(
        `SELECT wn_rank FROM ranking
         WHERE wn_institution = $1::uuid AND wn_category = $2
         ORDER BY updated_at DESC NULLS LAST LIMIT 1`,
        id,
        RANK_OVERALL,
      ),
    ]);

  const overallRank = overallRankRows[0]?.wn_rank ?? null;

  const streamBy = mapBy(streams, "wn_streamid");
  const courseBy = mapBy(courses, "wn_courseid");
  const discBy = mapBy(disciplines, "wn_disciplineid");
  const schoolBy = mapBy([...schools, ...relatedSchools], "wn_schoolid");
  const deptBy = mapBy(depts, "wn_departmentid");
  const rbBy = mapBy(rankingBodies, "wn_rankingbodyid");
  const regBy = mapBy(regBodies, "wn_regulatorybodyid");
  const yearBy = mapBy(years, "wn_academicyearid");
  const examBy = mapBy(entranceExams, "wn_entranceexamid");
  const uniBy = mapBy(unis, "wn_institutionid");

  const feesByProgram = new Map<string, any[]>();
  for (const fee of fees) {
    const pid = fee.wn_institutioncourse;
    if (!pid) continue;
    const list = feesByProgram.get(pid) ?? [];
    list.push(fee);
    feesByProgram.set(pid, list);
  }

  const engg = rankings.find((r) => r.wn_category === RANK_ENGINEERING);
  const placementRow = placements[0];
  const placement = placementRow
    ? {
        placementPct: dec(placementRow.wn_placementpct),
        averagePackage:
          dec(placementRow.wn_averagepackagemin) ??
          dec(placementRow.wn_medianpackage) ??
          dec(placementRow.wn_averagepackagemax),
        highestDomestic: dec(placementRow.wn_highestdomestic),
      }
    : null;

  return {
    id: i.wn_institutionid,
    name: i.wn_name!,
    slug: publicSlug(i),
    shortDescription: i.wn_shortdescription,
    logoUrl: i.wn_logourl,
    coverImageUrl: i.wn_coverimageurl,
    city: i.wn_city,
    state: i.wn_state,
    institutionType: requireOpt("institutionType", i.wn_institutiontype),
    ownership: requireOpt("ownership", i.wn_ownership),
    naacGrade: requireOpt("naacGrade", i.wn_naacgrade),
    establishedYear: i.wn_establishedyear,
    isFeatured: !!i.wn_isfeatured,
    verified,
    tuitionMin: dec(b.tuition_min as never),
    tuitionMax: dec(b.tuition_max as never),
    latestOverallRank: overallRank,
    metaTitle: i.wn_metatitle,
    metaDescription: i.wn_metadescription,
    videoTourUrl: i.wn_videotoururl,
    genderPolicy: requireOpt("genderPolicy", i.wn_genderpolicy),
    minorityStatus: requireOpt("minorityStatus", i.wn_minoritystatus),
    aisheCode: i.wn_aishecode,
    naacValidTill: iso(i.wn_naacvalidtill),
    ugcRecognized: i.wn_ugcrecongnized,
    aicteApproved: i.wn_aicteapproved,
    addressLine1: i.wn_addressline1,
    addressLine2: i.wn_addressline2,
    district: i.wn_district,
    pincode: i.wn_pincode,
    countryName: b.country_name ?? null,
    latitude: dec(i.wn_latitude),
    longitude: dec(i.wn_longitude),
    campusSizeAcres: dec(i.wn_campussizeacres),
    phone: i.wn_phone,
    email: i.wn_email,
    admissionsEmail: i.wn_admissionsemail,
    website: i.wn_website,
    promotingBody: i.wn_promotingbody,
    affiliatedUniversityName: b.university_name ?? null,
    hasWifi: i.wn_haswifi,
    hasMedical: i.wn_hasmedical,
    hasSports: i.wn_hassports,
    hasTransport: i.wn_hastransport,
    hasPlacementCell: i.wn_hasplacementcell,
    hasResearchCenter: i.wn_hasresearchcenter,
    hasIncubation: i.wn_hasincubation,
    hasInternshipSupport: i.wn_hasinternshipsupport,
    hasAlumniNetwork: i.wn_hasalumninetwork,
    hasGrievanceCell: i.wn_hasgrievancecell,
    hasAntiRagging: i.wn_hasantiragging,
    hasIcc: i.wn_hasicc,
    hasCounselling: i.wn_hascounselling,
    hasNssNcc: i.wn_hasnssncc,
    updatedAt: i.updated_at.toISOString(),
    aliases: aliases.map((a) => ({
      name: a.wn_name ?? "",
      slug: a.wn_slug,
      aliasType: requireOpt("aliasType", a.wn_aliastype),
      isPrimary: !!a.wn_isprimary,
      redirectToMain: !!a.wn_redirecttomain,
    })),
    schools: schools.map((s) => ({
      name: s.wn_name ?? "",
      slug: s.wn_slug,
      shortDescription: s.wn_shortdescription,
      establishedYear: s.wn_establishedyear,
      dean: s.wn_dean,
      academicCalendar: requireOpt("academicCalendar", s.wn_academiccalendar),
      primaryStreamName: s.wn_primarystream ? (streamBy.get(s.wn_primarystream)?.wn_name ?? null) : null,
      hasLabs: s.wn_haslabs,
      hasLibrary: s.wn_haslibrary,
      hasPlacementCell: s.wn_hasplacementcell,
      hasSports: s.wn_hassports,
    })),
    programs: programs.map((p) => {
      const course = p.wn_course ? courseBy.get(p.wn_course) : null;
      const progFees = feesByProgram.get(p.wn_institutioncourseid) ?? [];
      const tuitionFees = progFees.filter((f) => f.wn_feecategory === FEE_TUITION);
      const totalFees = progFees.filter((f) => f.wn_feecategory === FEE_TOTAL);
      const tMin = tuitionFees.map((f) => dec(f.wn_amountmin)).filter((n): n is number => n != null);
      const tMax = tuitionFees.map((f) => dec(f.wn_amountmax)).filter((n): n is number => n != null);
      const totMin = totalFees.map((f) => dec(f.wn_amountmin)).filter((n): n is number => n != null);
      const totMax = totalFees.map((f) => dec(f.wn_amountmax)).filter((n): n is number => n != null);
      return {
        id: p.wn_institutioncourseid,
        name: p.wn_name ?? course?.wn_name ?? "",
        slug: p.wn_slug,
        courseName: course?.wn_name ?? null,
        courseShortName: course?.wn_shortname ?? null,
        degreeLevel: requireOpt("degreeLevel", course?.wn_degreelevel),
        disciplineName: p.wn_discipline ? (discBy.get(p.wn_discipline)?.wn_name ?? null) : null,
        streamName: p.wn_stream ? (streamBy.get(p.wn_stream)?.wn_name ?? null) : null,
        schoolName: p.wn_school ? (schoolBy.get(p.wn_school)?.wn_name ?? null) : null,
        departmentName: p.wn_department ? (deptBy.get(p.wn_department)?.wn_name ?? null) : null,
        durationYears: dec(p.wn_durationyears),
        educationMode: requireOpt("educationMode", p.wn_educationmode),
        academicCalendar: requireOpt("academicCalendar", p.wn_academiccalendar),
        totalSeats: p.wn_totalseats,
        isActive: p.wn_isactive !== false,
        accreditedByNba: p.wn_accreditedbynba,
        nbaValidTill: iso(p.wn_nbavalidtill),
        eligibilityCriteria: p.wn_eligibilitycriteria,
        admissionProcess: p.wn_admissionprocess,
        tuitionMin: tMin.length ? Math.min(...tMin) : null,
        tuitionMax: tMax.length ? Math.max(...tMax) : null,
        totalFeeMin: totMin.length ? Math.min(...totMin) : null,
        totalFeeMax: totMax.length ? Math.max(...totMax) : null,
        fees: progFees.map((f) => ({
          feeCategory: requireOpt("feeCategory", f.wn_feecategory),
          amountMin: dec(f.wn_amountmin),
          amountMax: dec(f.wn_amountmax),
          frequency: requireOpt("feeFrequency", f.wn_frequency),
          notes: f.wn_notes,
          academicYearName: f.wn_academicyear ? (yearBy.get(f.wn_academicyear)?.wn_name ?? null) : null,
        })),
      };
    }),
    rankings: rankings.map((r) => ({
      rankingBodyName: r.wn_rankingbody ? (rbBy.get(r.wn_rankingbody)?.wn_name ?? "Unknown") : "Unknown",
      academicYearName: r.wn_academicyear ? (yearBy.get(r.wn_academicyear)?.wn_name ?? null) : null,
      category: requireOpt("rankingCategory", r.wn_category),
      rank: r.wn_rank,
      rankBand: r.wn_rankband,
      score: dec(r.wn_score),
    })),
    accreditations: accreditations.map((a) => ({
      bodyName: a.wn_regulatorybody ? (regBy.get(a.wn_regulatorybody)?.wn_name ?? "Unknown") : "Unknown",
      grade: requireOpt("accreditationGrade", a.wn_grade),
      cgpaScore: dec(a.wn_cgpascore),
      cycleNumber: a.wn_cyclenumber,
      validFrom: iso(a.wn_validfrom),
      validTill: iso(a.wn_validtill),
      programName: null as string | null,
    })),
    approvals: approvals.map((a) => ({
      bodyName: a.wn_regulatorybody ? (regBy.get(a.wn_regulatorybody)?.wn_name ?? "Unknown") : "Unknown",
      approvalStatus: requireOpt("approvalStatus", a.wn_approvalstatus),
      approvalNumber: a.wn_approvalnumber,
      validFrom: iso(a.wn_validfrom),
      validTill: iso(a.wn_validtill),
    })),
    affiliations: affiliations.map((a) => ({
      universityName: a.wn_university ? (uniBy.get(a.wn_university)?.wn_name ?? "Unknown") : "Unknown",
      affiliationType: requireOpt("affiliationType", a.wn_affiliationtype),
      isCurrent: !!a.wn_iscurrent,
    })),
    examsAccepted: exams.map((e) => {
      const exam = e.wn_entranceexam ? examBy.get(e.wn_entranceexam) : null;
      return {
        examName: exam?.wn_name ?? e.wn_name ?? "Unknown",
        examShortName: exam?.wn_shortname ?? null,
        isPrimary: e.wn_isprimaryexam,
        weightagePercent: dec(e.wn_weightagepercent),
        applicableCourseName: null as string | null,
        academicYearName: e.wn_academicyear ? (yearBy.get(e.wn_academicyear)?.wn_name ?? null) : null,
      };
    }),
    gallery: gallery.map((g) => ({
      mediaUrl: g.wn_mediaurl,
      thumbnailUrl: g.wn_thumbnailurl,
      altText: g.wn_alttext,
      isFeatured: !!g.wn_isfeatured,
    })),
    placement,
    latestEngineeringRank: engg?.wn_rank ?? null,
  };
}

function asArr(v: unknown): any[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function uniq(vals: unknown[]): string[] {
  return [...new Set(vals.filter((v): v is string => typeof v === "string" && !!v))];
}

function mapBy(rows: any[], key: string) {
  return new Map(rows.map((r) => [r[key], r]));
}
