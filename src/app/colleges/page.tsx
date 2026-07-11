import type { Metadata } from "next";
import { CollegesDirectory } from "@/components/colleges-directory";

export const metadata: Metadata = {
  title: "Browse colleges",
  description: "Filter Indian colleges by state, stream, fees, NAAC grade and NIRF rank band.",
  openGraph: {
    title: "Browse colleges — MyGuruva",
    description: "Filter Indian colleges by state, stream, fees, NAAC grade and rank.",
    url: "/colleges",
  },
  alternates: { canonical: "/colleges" },
};

export default function CollegesPage() {
  return <CollegesDirectory />;
}
