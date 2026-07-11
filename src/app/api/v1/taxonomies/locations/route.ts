import { LOCATIONS } from "@/lib/mock-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const parentId = url.searchParams.get("parentId");
  let items = LOCATIONS.slice();
  if (type) items = items.filter((l) => l.locationType === type);
  if (parentId) items = items.filter((l) => l.parentId === parentId);
  return Response.json({ items });
}
