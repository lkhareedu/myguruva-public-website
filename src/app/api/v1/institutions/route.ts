import { listInstitutions } from "@/lib/api-service";
import { filtersFromSearchParams } from "@/lib/api-query";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json(listInstitutions(filtersFromSearchParams(url.searchParams)));
}
