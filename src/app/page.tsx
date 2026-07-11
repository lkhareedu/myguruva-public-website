import Link from "next/link";
import { listInstitutions } from "@/lib/api-service";
import { CollegeCard } from "@/components/college-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MyGuruva — Discover India's colleges",
  description:
    "Search programs, fees and rankings across quality-reviewed Indian colleges. Compare up to four side by side.",
  openGraph: {
    title: "MyGuruva — Discover India's colleges",
    description: "Search programs, fees and rankings across quality-reviewed Indian colleges.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let data = await listInstitutions({ featured: true, pageSize: 6, sort: "relevance" });
  const usingFeatured = data.items.length > 0;
  if (!usingFeatured) {
    data = await listInstitutions({ pageSize: 6, sort: "name" });
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, var(--saffron), transparent 45%), radial-gradient(circle at 85% 40%, var(--terracotta), transparent 40%)",
          }}
        />
        <div className="container-page relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Quality-reviewed Indian colleges
            </div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Find your college.
              <br />
              <span className="text-primary">Trust the details.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Browse colleges from our CRM catalog. The Verified badge means our team completed a
              two-stage review of the institution&apos;s data.
            </p>
            <form
              action="/search"
              method="get"
              className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-sm"
            >
              <input
                name="q"
                placeholder="Search colleges, cities, streams…"
                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Search
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {["Engineering", "Management", "Hyderabad", "Mumbai", "NIRF Top 50"].map((t) => (
                <Link
                  key={t}
                  href={`/colleges?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground hover:text-foreground"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">
              {usingFeatured ? "Featured colleges" : "Explore colleges"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {usingFeatured
                ? "Hand-picked institutions from our editorial team."
                : `${data.total.toLocaleString()} colleges in the catalog — start browsing.`}
            </p>
          </div>
          <Link href="/colleges" className="shrink-0 text-sm font-medium text-primary hover:underline">
            Browse all →
          </Link>
        </div>
        {data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No colleges available yet.{" "}
            <Link href="/colleges" className="text-primary hover:underline">
              Browse directory
            </Link>
          </div>
        ) : (
          <div className="college-results-grid">
            {data.items.map((i) => (
              <CollegeCard key={i.id} i={i} />
            ))}
          </div>
        )}
      </section>

      <section className="container-page pb-20">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-[color:var(--saffron)]/15 to-[color:var(--terracotta)]/10 p-8 md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl">Compare, side by side.</h2>
              <p className="mt-2 text-muted-foreground">
                Line up to four Verified colleges — fees, NAAC, NIRF, seats, placements and amenities in one table.
              </p>
            </div>
            <Link
              href="/compare"
              className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
            >
              Start comparing →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
