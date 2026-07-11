import { RANKING_BODIES } from "@/lib/mock-data";

export async function GET() {
  return Response.json({ items: RANKING_BODIES });
}
