import type { Metadata } from "next";
import { ComparePageClient } from "@/components/compare-page";

export const metadata: Metadata = {
  title: "Compare colleges",
  description:
    "Compare up to four Verified Indian colleges side by side — fees, NAAC, NIRF rank, seats and amenities.",
  openGraph: {
    title: "Compare colleges — MyGuruva",
    description: "Compare up to four Verified Indian colleges side by side.",
    url: "/compare",
  },
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return <ComparePageClient />;
}
