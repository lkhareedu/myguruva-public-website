import { prisma } from "../prisma.js";
import { ACTIVE, FEE_TOTAL, FEE_TUITION, PUBLISHED, RANK_ENGINEERING } from "../lib/gates.js";
import { dec, iso, requireOpt } from "../lib/option-sets.js";
import { overallRanks, tuitionByInstitution, verifiedIds } from "./list.js";

export async function getInstitutionBySlug(slug: string) {
  const publicWhere = { wn_publishstatus: PUBLISHED, wn_currentstatus: ACTIVE };

  const bySlug = await prisma.institution.findFirst({
    where: { ...publicWhere, wn_slug: slug },
  });

  if (!bySlug) {
    const alias = await prisma.institutionAlias.findFirst({ where: { wn_slug: slug } });
    if (!alias?.wn_institution) return { kind: "notFound" as const };
    const parent = await prisma.institution.findFirst({
      where: { ...publicWhere, wn_institutionid: alias.wn_institution },
    });
    if (!parent?.wn_slug) return { kind: "notFound" as const };
    if (alias.wn_redirecttomain) {
      return { kind: "redirect" as const, primarySlug: parent.wn_slug };
    }
    return { kind: "detail" as const, data: await buildDetail(parent) };
  }

  return { kind: "detail" as const, data: await buildDetail(bySlug) };
}

async function buildDetail(i: NonNullable<Awaited<ReturnType<typeof prisma.institution.findFirst>>>) {
  const id = i.wn_institutionid;
  const [verified, tuition, ranksMap] = await Promise.all([
    verifiedIds(),
    tuitionByInstitution([id]),
    overallRanks([id]),
  ]);
  const t = tuition.get(id) ?? { min: null, max: null };

  const [
    aliases,
    schools,
    programs,
    rankings,
    accreditations,
    approvals,
    affiliations,
    exams,
    gallery,
    placements,
    country,
    university,
  ] = await Promise.all([
    prisma.institutionAlias.findMany({ where: { wn_institution: id } }),
    prisma.school.findMany({ where: { wn_institution: id } }),
    prisma.institutionCourse.findMany({ where: { wn_institution: id } }),
    prisma.ranking.findMany({ where: { wn_institution: id }, orderBy: { updated_at: "desc" } }),
    prisma.accreditation.findMany({ where: { wn_institution: id } }),
    prisma.approval.findMany({ where: { wn_institution: id } }),
    prisma.affiliation.findMany({ where: { wn_institution: id } }),
    prisma.examAccepted.findMany({ where: { wn_institution: id } }),
    prisma.gallery.findMany({ where: { wn_institution: id }, orderBy: { wn_displayorder: "asc" } }),
    prisma.placementSummary.findMany({
      where: { wn_institution: id },
      orderBy: { updated_at: "desc" },
      take: 1,
    }),
    i.wn_country ? prisma.location.findUnique({ where: { wn_locationid: i.wn_country } }) : null,
    i.wn_affiliateduniversity
      ? prisma.institution.findUnique({ where: { wn_institutionid: i.wn_affiliateduniversity } })
      : null,
  ]);

  const streamIds = [
    ...new Set([
      ...schools.map((s) => s.wn_primarystream).filter(Boolean),
      ...programs.map((p) => p.wn_stream).filter(Boolean),
    ]),
  ] as string[];
  const courseIds = programs.map((p) => p.wn_course).filter(Boolean) as string[];
  const disciplineIds = programs.map((p) => p.wn_discipline).filter(Boolean) as string[];
  const schoolIds = programs.map((p) => p.wn_school).filter(Boolean) as string[];
  const deptIds = programs.map((p) => p.wn_department).filter(Boolean) as string[];
  const bodyIds = [
    ...rankings.map((r) => r.wn_rankingbody),
    ...accreditations.map((a) => a.wn_regulatorybody),
    ...approvals.map((a) => a.wn_regulatorybody),
  ].filter(Boolean) as string[];
  const yearIds = [
    ...rankings.map((r) => r.wn_academicyear),
    ...exams.map((e) => e.wn_academicyear),
  ].filter(Boolean) as string[];
  const examIds = exams.map((e) => e.wn_entranceexam).filter(Boolean) as string[];
  const uniIds = affiliations.map((a) => a.wn_university).filter(Boolean) as string[];
  const programIds = programs.map((p) => p.wn_institutioncourseid);

  const [streams, courses, disciplines, depts, rankingBodies, regBodies, years, entranceExams, unis, fees] =
    await Promise.all([
      streamIds.length ? prisma.stream.findMany({ where: { wn_streamid: { in: streamIds } } }) : [],
      courseIds.length ? prisma.course.findMany({ where: { wn_courseid: { in: courseIds } } }) : [],
      disciplineIds.length
        ? prisma.discipline.findMany({ where: { wn_disciplineid: { in: disciplineIds } } })
        : [],
      deptIds.length ? prisma.department.findMany({ where: { wn_departmentid: { in: deptIds } } }) : [],
      bodyIds.length ? prisma.rankingBody.findMany({ where: { wn_rankingbodyid: { in: bodyIds } } }) : [],
      bodyIds.length
        ? prisma.regulatoryBody.findMany({ where: { wn_regulatorybodyid: { in: bodyIds } } })
        : [],
      yearIds.length ? prisma.academicYear.findMany({ where: { wn_academicyearid: { in: yearIds } } }) : [],
      examIds.length ? prisma.entranceExam.findMany({ where: { wn_entranceexamid: { in: examIds } } }) : [],
      uniIds.length ? prisma.institution.findMany({ where: { wn_institutionid: { in: uniIds } } }) : [],
      programIds.length
        ? prisma.feeStructure.findMany({ where: { wn_institutioncourse: { in: programIds } } })
        : [],
    ]);

  const streamBy = new Map(streams.map((s) => [s.wn_streamid, s]));
  const courseBy = new Map(courses.map((c) => [c.wn_courseid, c]));
  const discBy = new Map(disciplines.map((d) => [d.wn_disciplineid, d]));
  const schoolBy = new Map(schools.map((s) => [s.wn_schoolid, s]));
  for (const s of await (schoolIds.length
    ? prisma.school.findMany({ where: { wn_schoolid: { in: schoolIds } } })
    : Promise.resolve([]))) {
    schoolBy.set(s.wn_schoolid, s);
  }
  const deptBy = new Map(depts.map((d) => [d.wn_departmentid, d]));
  const rbBy = new Map(rankingBodies.map((b) => [b.wn_rankingbodyid, b]));
  const regBy = new Map(regBodies.map((b) => [b.wn_regulatorybodyid, b]));
  const yearBy = new Map(years.map((y) => [y.wn_academicyearid, y]));
  const examBy = new Map(entranceExams.map((e) => [e.wn_entranceexamid, e]));
  const uniBy = new Map(unis.map((u) => [u.wn_institutionid, u]));
  const feesByProgram = new Map<string, typeof fees>();
  for (const fee of fees) {
    const pid = fee.wn_institutioncourse;
    if (!pid) continue;
    const list = feesByProgram.get(pid) ?? [];
    list.push(fee);
    feesByProgram.set(pid, list);
  }

  const engg = rankings.find((r) => r.wn_category === RANK_ENGINEERING);
  const placement = placements[0]
    ? {
        placementPct: dec(placements[0].wn_placementpct),
        averagePackage:
          dec(placements[0].wn_averagepackagemin) ??
          dec(placements[0].wn_medianpackage) ??
          dec(placements[0].wn_averagepackagemax),
        highestDomestic: dec(placements[0].wn_highestdomestic),
      }
    : null;

  return {
    id: i.wn_institutionid,
    name: i.wn_name!,
    slug: i.wn_slug!,
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
    verified: verified.has(id),
    tuitionMin: t.min,
    tuitionMax: t.max,
    latestOverallRank: ranksMap.get(id) ?? null,
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
    countryName: country?.wn_name ?? null,
    latitude: dec(i.wn_latitude),
    longitude: dec(i.wn_longitude),
    campusSizeAcres: dec(i.wn_campussizeacres),
    phone: i.wn_phone,
    email: i.wn_email,
    admissionsEmail: i.wn_admissionsemail,
    website: i.wn_website,
    promotingBody: i.wn_promotingbody,
    affiliatedUniversityName: university?.wn_name ?? null,
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
