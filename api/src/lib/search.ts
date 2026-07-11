/**
 * Build a tolerant institution search predicate.
 * Uses ILIKE + token AND + optional pg_trgm similarity when available.
 * Typo variants cover common 1-edit mistakes without requiring extensions.
 */

export function searchTokens(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/** Generate simple 1-edit deletion/adjacent-swap/duplicate variants for fuzzy ILIKE. */
export function typoVariants(token: string, limit = 16): string[] {
  const t = token.toLowerCase();
  if (t.length < 4) return [];
  const out: string[] = [];
  const add = (v: string) => {
    if (v && v !== t && !out.includes(v)) out.push(v);
  };

  // Duplicate a letter (sidhartha → siddhartha) — highest value for name typos
  for (let i = 0; i < t.length; i++) {
    add(t.slice(0, i) + t[i] + t.slice(i));
  }
  // Adjacent transposition
  for (let i = 0; i < t.length - 1; i++) {
    const chars = t.split("");
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    add(chars.join(""));
  }
  // Single deletion
  for (let i = 0; i < t.length; i++) {
    const del = t.slice(0, i) + t.slice(i + 1);
    if (del.length >= 3) add(del);
  }

  return out.slice(0, limit);
}

export type SearchClause = {
  sql: string;
  params: unknown[];
  nextParam: number;
};

/**
 * Append search conditions for list/suggest queries.
 * `alias` is the institutions table alias (usually `i`).
 */
export function buildInstitutionSearchClause(
  q: string,
  startParam: number,
  opts?: { includeDescription?: boolean; useTrgm?: boolean },
): SearchClause | null {
  const query = q.trim();
  if (!query) return null;

  const includeDescription = opts?.includeDescription !== false;
  const useTrgm = !!opts?.useTrgm;
  const params: unknown[] = [];
  let p = startParam;
  const parts: string[] = [];

  // Full-string contains
  parts.push(`i.wn_name ILIKE '%' || $${p} || '%'`);
  parts.push(`i.wn_city ILIKE '%' || $${p} || '%'`);
  parts.push(`i.wn_state ILIKE '%' || $${p} || '%'`);
  if (includeDescription) {
    parts.push(`i.wn_shortdescription ILIKE '%' || $${p} || '%'`);
  }
  parts.push(`EXISTS (
    SELECT 1 FROM institution_alias a
    WHERE a.wn_institution = i.wn_institutionid AND a.wn_name ILIKE '%' || $${p} || '%'
  )`);
  params.push(query);
  p++;

  // FTS (prefix-friendly via plainto; still useful for multi-word)
  parts.push(`to_tsvector('simple',
      coalesce(i.wn_name,'') || ' ' || coalesce(i.wn_city,'') || ' ' || coalesce(i.wn_state,'')
      ${includeDescription ? "|| ' ' || coalesce(i.wn_shortdescription,'')" : ""}
    ) @@ plainto_tsquery('simple', $${p})`);
  params.push(query);
  p++;

  // Token AND: every significant token must match somewhere
  const tokens = searchTokens(query);
  if (tokens.length >= 2) {
    const tokenAnd = tokens.map((tok) => {
      const clause = `(
        i.wn_name ILIKE '%' || $${p} || '%'
        OR i.wn_city ILIKE '%' || $${p} || '%'
        OR i.wn_state ILIKE '%' || $${p} || '%'
        OR EXISTS (
          SELECT 1 FROM institution_alias a
          WHERE a.wn_institution = i.wn_institutionid AND a.wn_name ILIKE '%' || $${p} || '%'
        )
      )`;
      params.push(tok);
      p++;
      return clause;
    });
    parts.push(`(${tokenAnd.join(" AND ")})`);
  }

  // Typo / fuzzy variants (1-edit) — strongest for single-token queries like "sidhartha"
  const variants = new Set<string>();
  if (tokens.length <= 1) {
    for (const v of typoVariants(query.replace(/\s+/g, ""))) variants.add(v);
  }
  for (const t of tokens.filter((tok) => tok.length >= 4)) {
    for (const v of typoVariants(t, 8)) variants.add(v);
  }
  for (const v of [...variants].slice(0, 16)) {
    parts.push(`i.wn_name ILIKE '%' || $${p} || '%'`);
    parts.push(`EXISTS (
      SELECT 1 FROM institution_alias a
      WHERE a.wn_institution = i.wn_institutionid AND a.wn_name ILIKE '%' || $${p} || '%'
    )`);
    params.push(v);
    p++;
  }

  if (useTrgm && query.length >= 3) {
    parts.push(`similarity(lower(coalesce(i.wn_name,'')), lower($${p})) > 0.28`);
    parts.push(`EXISTS (
      SELECT 1 FROM institution_alias a
      WHERE a.wn_institution = i.wn_institutionid
        AND similarity(lower(coalesce(a.wn_name,'')), lower($${p})) > 0.35
    )`);
    params.push(query);
    p++;
  }

  return {
    sql: `(${parts.join(" OR ")})`,
    params,
    nextParam: p,
  };
}
