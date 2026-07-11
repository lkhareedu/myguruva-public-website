import { sitemapInstitutions } from "@/lib/api-service";

export async function GET() {
  return Response.json(await sitemapInstitutions());
}
