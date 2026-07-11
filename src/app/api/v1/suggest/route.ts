import { suggestSearch } from "@/lib/api-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  return Response.json(await suggestSearch(q));
}
