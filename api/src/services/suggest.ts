import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { ACTIVE, PUBLISHED, publicSlug } from "../lib/gates.js";
import { buildInstitutionSearchClause } from "../lib/search.js";
import { hasPgTrgm } from "../lib/trgm.js";
import { verifiedIds } from "./list.js";

export async function suggestSearch(q: string) {
  const query = q.trim();
  if (!query) return { colleges: [], streams: [], cities: [] };

  const verified = await verifiedIds();
  const useTrgm = await hasPgTrgm();

  type CollegeRow = {
    id: string;
    slug: string | null;
    name: string;
    city: string | null;
    state: string | null;
  };

  const gates = env.relaxPublicGates
    ? `i.wn_name IS NOT NULL`
    : `i.wn_publishstatus = ${PUBLISHED} AND i.wn_currentstatus = ${ACTIVE} AND i.wn_slug IS NOT NULL`;

  const clause = buildInstitutionSearchClause(query, 1, {
    includeDescription: false,
    useTrgm,
  });

  const colleges = clause
    ? await prisma.$queryRawUnsafe<CollegeRow[]>(
        `
        SELECT i.wn_institutionid AS id, i.wn_slug AS slug, i.wn_name AS name,
               i.wn_city AS city, i.wn_state AS state
        FROM institutions i
        WHERE ${gates}
          AND ${clause.sql}
        ORDER BY i.wn_isfeatured DESC NULLS LAST, i.wn_name ASC
        LIMIT 8
        `,
        ...clause.params,
      )
    : [];

  const streams = await prisma.stream.findMany({
    where: {
      OR: [
        { wn_name: { contains: query, mode: "insensitive" } },
        { wn_slug: { contains: query, mode: "insensitive" } },
      ],
      ...(env.relaxPublicGates ? {} : { wn_isactive: true }),
    },
    take: 4,
    orderBy: { wn_name: "asc" },
  });

  type CityRow = { city: string };
  const like = `%${query}%`;
  const cityRows = env.relaxPublicGates
    ? await prisma.$queryRawUnsafe<CityRow[]>(
        `
        SELECT DISTINCT i.wn_city AS city
        FROM institutions i
        WHERE i.wn_city IS NOT NULL AND i.wn_city ILIKE $1
        ORDER BY city ASC
        LIMIT 4
        `,
        like,
      )
    : await prisma.$queryRawUnsafe<CityRow[]>(
        `
        SELECT DISTINCT i.wn_city AS city
        FROM institutions i
        WHERE i.wn_publishstatus = $1 AND i.wn_currentstatus = $2
          AND i.wn_city IS NOT NULL AND i.wn_city ILIKE $3
        ORDER BY city ASC
        LIMIT 4
        `,
        PUBLISHED,
        ACTIVE,
        like,
      );

  return {
    colleges: colleges.map((c) => ({
      slug: publicSlug({ wn_slug: c.slug, wn_institutionid: c.id }),
      name: c.name,
      city: c.city,
      state: c.state,
      verified: verified.has(c.id),
    })),
    streams: streams
      .filter((s) => s.wn_slug && s.wn_name)
      .map((s) => ({ slug: s.wn_slug!, name: s.wn_name! })),
    cities: cityRows.map((r) => r.city).filter(Boolean),
  };
}
