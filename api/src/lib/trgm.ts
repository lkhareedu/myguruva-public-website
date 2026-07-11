import { prisma } from "../prisma.js";

let cached: boolean | null = null;

/** True when pg_trgm is installed (similarity() works). */
export async function hasPgTrgm(): Promise<boolean> {
  if (cached != null) return cached;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ ok: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS ok`,
    );
    cached = !!rows[0]?.ok;
  } catch {
    cached = false;
  }
  return cached;
}
