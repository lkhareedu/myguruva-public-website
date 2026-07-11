import { STREAMS } from "@/lib/mock-data";

export async function GET() {
  return Response.json({ items: STREAMS });
}
