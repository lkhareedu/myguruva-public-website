import { compareInstitutions } from "@/lib/api-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("slugs") ?? "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return Response.json(await compareInstitutions(slugs));
}
