import type { MetadataRoute } from "next";
import { sitemapInstitutions } from "@/lib/api-service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://myguruva.com";
  const { items } = await sitemapInstitutions();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/colleges`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.6 },
    ...items.map((i) => ({
      url: `${base}/colleges/${i.slug}`,
      lastModified: new Date(i.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
