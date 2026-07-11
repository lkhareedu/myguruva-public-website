import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search-page";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Indian colleges by name, city, stream or exam.",
  robots: { index: false },
};

export default function SearchPage() {
  return <SearchPageClient />;
}
