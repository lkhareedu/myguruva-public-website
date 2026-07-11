import { EXAMS } from "@/lib/mock-data";

export async function GET() {
  return Response.json({ items: EXAMS });
}
