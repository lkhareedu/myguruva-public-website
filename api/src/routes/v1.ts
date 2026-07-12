import { Router } from "express";
import { listInstitutions, type ListFilters } from "../services/list.js";
import { getInstitutionBySlug } from "../services/detail.js";
import { compareInstitutions } from "../services/compare.js";
import { suggestSearch } from "../services/suggest.js";
import {
  listCourses,
  listExams,
  listLocations,
  listRankingBodies,
  listStreams,
  sitemapInstitutions,
} from "../services/taxonomies.js";

export const v1 = Router();

v1.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

function parseListFilters(q: Record<string, unknown>): ListFilters {
  const num = (k: string) => {
    const v = q[k];
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const bool = (k: string) => {
    const v = q[k];
    if (v == null || v === "") return undefined;
    return v === "true" || v === "1" || v === true;
  };
  const sort = q.sort;
  return {
    q: typeof q.q === "string" ? q.q : undefined,
    state: typeof q.state === "string" ? q.state : undefined,
    city: typeof q.city === "string" ? q.city : undefined,
    institutionType: num("institutionType"),
    ownership: num("ownership"),
    naacGrade: num("naacGrade"),
    stream: typeof q.stream === "string" ? q.stream : undefined,
    degreeLevel: num("degreeLevel"),
    feeMin: num("feeMin"),
    feeMax: num("feeMax"),
    rankBand: typeof q.rankBand === "string" ? q.rankBand : undefined,
    verified: bool("verified"),
    featured: bool("featured"),
    page: num("page"),
    pageSize: num("pageSize"),
    sort:
      sort === "relevance" || sort === "rank" || sort === "fees" || sort === "name"
        ? sort
        : undefined,
  };
}

v1.get("/institutions", async (req, res, next) => {
  try {
    res.json(await listInstitutions(parseListFilters(req.query as Record<string, unknown>)));
  } catch (e) {
    next(e);
  }
});

v1.get("/institutions/:slug", async (req, res, next) => {
  try {
    const result = await getInstitutionBySlug(req.params.slug);
    if (result.kind === "notFound") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (result.kind === "redirect") {
      res.redirect(301, `/v1/institutions/${result.primarySlug}`);
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.json(result.data);
  } catch (e) {
    next(e);
  }
});

v1.get("/compare", async (req, res, next) => {
  try {
    const raw = typeof req.query.slugs === "string" ? req.query.slugs : "";
    const slugs = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (slugs.length < 2 || slugs.length > 4) {
      res.status(400).json({ error: "Provide 2–4 slugs via ?slugs=a,b,c" });
      return;
    }
    res.json(await compareInstitutions(slugs));
  } catch (e) {
    next(e);
  }
});

v1.get("/suggest", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json(await suggestSearch(q));
  } catch (e) {
    next(e);
  }
});

v1.get("/taxonomies/streams", async (_req, res, next) => {
  try {
    res.json(await listStreams());
  } catch (e) {
    next(e);
  }
});

v1.get("/taxonomies/courses", async (_req, res, next) => {
  try {
    res.json(await listCourses());
  } catch (e) {
    next(e);
  }
});

v1.get("/taxonomies/locations", async (req, res, next) => {
  try {
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const parentId = typeof req.query.parentId === "string" ? req.query.parentId : undefined;
    res.json(await listLocations(type, parentId));
  } catch (e) {
    next(e);
  }
});

v1.get("/taxonomies/exams", async (_req, res, next) => {
  try {
    res.json(await listExams());
  } catch (e) {
    next(e);
  }
});

v1.get("/taxonomies/ranking-bodies", async (_req, res, next) => {
  try {
    res.json(await listRankingBodies());
  } catch (e) {
    next(e);
  }
});

v1.get("/sitemap/institutions", async (_req, res, next) => {
  try {
    res.json(await sitemapInstitutions());
  } catch (e) {
    next(e);
  }
});
