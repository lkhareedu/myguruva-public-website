import { prisma } from "../prisma.js";
import { ACTIVE, PUBLISHED } from "../lib/gates.js";
import { verifiedIds } from "./list.js";

export async function suggestSearch(q: string) {
  const query = q.trim();
  if (!query) return { colleges: [], streams: [], cities: [] };

  const like = `%${query}%`;
  const verified = await verifiedIds();

  type CollegeRow = {
    slug: string;
    name: string;
    city: string | null;
    state: string | null;
    id: string;
  };

  const colleges = await prisma.$queryRawUnsafe<CollegeRow[]>(
    `
    SELECT i.wn_institutionid AS id, i.wn_slug AS slug, i.wn_name AS name,
           i.wn_city AS city, i.wn_state AS state
    FROM institutions i
    WHERE i.wn_publishstatus = $1 AND i.wn_currentstatus = $2 AND i.wn_slug IS NOT NULL
      AND (
        i.wn_name ILIKE $3
        OR i.wn_city ILIKE $3
        OR i.wn_state ILIKE $3
        OR to_tsvector('simple', coalesce(i.wn_name,'') || ' ' || coalesce(i.wn_city,''))
             @@ plainto_tsquery('simple', $4)
        OR EXISTS (
          SELECT 1 FROM institution_alias a
          WHERE a.wn_institution = i.wn_institutionid AND a.wn_name ILIKE $3
        )
      )
    ORDER BY i.wn_isfeatured DESC NULLS LAST, i.wn_name ASC
    LIMIT 6
    `,
    PUBLISHED,
    ACTIVE,
    like,
    query,
  );

  const streams = await prisma.stream.findMany({
    where: {
      OR: [
        { wn_name: { contains: query, mode: "insensitive" } },
        { wn_slug: { contains: query, mode: "insensitive" } },
      ],
      wn_isactive: true,
    },
    take: 4,
    orderBy: { wn_name: "asc" },
  });

  type CityRow = { city: string };
  const cityRows = await prisma.$queryRawUnsafe<CityRow[]>(
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
      slug: c.slug,
      name: c.name,
      city: c.city,
      state: c.state,
      verified: verified.has(c.id),
    })),
    streams: streams
      .filter((s) => s.wn_slug && s.wn_name)
      .map((s) => ({ slug: s.wn_slug!, name: s.wn_name! })),
    cities: cityRows.map((c) => c.city),
  };
}
