import { getInstitutionBySlug } from "@/lib/api-service";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const r = getInstitutionBySlug(slug);
  if (r.kind === "notFound") {
    return new Response("Not found", { status: 404 });
  }
  if (r.kind === "redirect") {
    const url = new URL(request.url);
    url.pathname = `/v1/institutions/${r.primarySlug}`;
    return Response.redirect(url, 301);
  }
  return Response.json(r.data);
}
