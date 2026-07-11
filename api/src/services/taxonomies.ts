import { prisma } from "../prisma.js";
import { requireOpt } from "../lib/option-sets.js";

export async function listStreams() {
  const items = await prisma.stream.findMany({
    where: { wn_isactive: true },
    orderBy: [{ wn_displayorder: "asc" }, { wn_name: "asc" }],
  });
  return {
    items: items
      .filter((s) => s.wn_slug && s.wn_name)
      .map((s) => ({
        id: s.wn_streamid,
        name: s.wn_name!,
        shortName: s.wn_shortname,
        slug: s.wn_slug!,
      })),
  };
}

export async function listCourses() {
  const items = await prisma.course.findMany({ orderBy: { wn_name: "asc" } });
  return {
    items: items
      .filter((c) => c.wn_slug && c.wn_name)
      .map((c) => ({
        id: c.wn_courseid,
        name: c.wn_name!,
        shortName: c.wn_shortname,
        slug: c.wn_slug!,
        degreeLevel: requireOpt("degreeLevel", c.wn_degreelevel),
      })),
  };
}

export async function listLocations(type?: string, parentId?: string) {
  const typeMap: Record<string, number> = {
    country: 777770000,
    state: 777770001,
    city: 777770003,
  };
  const items = await prisma.location.findMany({
    where: {
      ...(type && typeMap[type] != null ? { wn_locationtype: typeMap[type] } : {}),
      ...(parentId ? { wn_parentlocation: parentId } : {}),
      wn_isactive: true,
    },
    orderBy: [{ wn_displayorder: "asc" }, { wn_name: "asc" }],
  });
  return {
    items: items
      .filter((l) => l.wn_name)
      .map((l) => ({
        id: l.wn_locationid,
        name: l.wn_name!,
        slug: l.wn_slug,
        type: l.wn_locationtype,
        parentId: l.wn_parentlocation,
        isMetro: l.wn_ismetro,
      })),
  };
}

export async function listExams() {
  const items = await prisma.entranceExam.findMany({ orderBy: { wn_name: "asc" } });
  return {
    items: items
      .filter((e) => e.wn_slug && e.wn_name)
      .map((e) => ({
        id: e.wn_entranceexamid,
        name: e.wn_name!,
        shortName: e.wn_shortname,
        slug: e.wn_slug!,
      })),
  };
}

export async function listRankingBodies() {
  const items = await prisma.rankingBody.findMany({ orderBy: { wn_name: "asc" } });
  return {
    items: items
      .filter((b) => b.wn_slug && b.wn_name)
      .map((b) => ({
        id: b.wn_rankingbodyid,
        name: b.wn_name!,
        shortName: b.wn_shortname,
        slug: b.wn_slug!,
      })),
  };
}

export async function sitemapInstitutions() {
  const items = await prisma.institution.findMany({
    where: {
      wn_publishstatus: 777770002,
      wn_currentstatus: 777770000,
      wn_slug: { not: null },
    },
    select: { wn_slug: true, updated_at: true },
    orderBy: { updated_at: "desc" },
  });
  return {
    items: items
      .filter((i) => i.wn_slug)
      .map((i) => ({ slug: i.wn_slug!, updatedAt: i.updated_at.toISOString() })),
  };
}
