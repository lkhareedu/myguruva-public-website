"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "./global-search";
import { CompareBadge } from "./compare-badge";

export function SiteHeader() {
  const pathname = usePathname();
  const collegesActive = pathname.startsWith("/colleges");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-lg leading-none text-primary-foreground">
            M
          </span>
          <span className="font-display text-lg tracking-tight">
            My<span className="text-primary">Guruva</span>
          </span>
        </Link>
        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch />
        </div>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/colleges"
            className={
              collegesActive
                ? "rounded-md bg-muted px-3 py-2 text-foreground"
                : "rounded-md px-3 py-2 text-foreground/80 hover:bg-muted hover:text-foreground"
            }
          >
            Colleges
          </Link>
          <CompareBadge />
        </nav>
      </div>
      <div className="container-page pb-3 md:hidden">
        <GlobalSearch compact />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background">
      <div className="container-page py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display text-base text-foreground">MyGuruva</div>
            <div>Indian college discovery — quality-reviewed listings.</div>
          </div>
          <div className="flex gap-6">
            <Link href="/colleges" className="hover:text-foreground">
              Browse
            </Link>
            <Link href="/compare" className="hover:text-foreground">
              Compare
            </Link>
            <a href="/sitemap.xml" className="hover:text-foreground">
              Sitemap
            </a>
          </div>
        </div>
        <div className="mt-6 text-xs">
          © {new Date().getFullYear()} MyGuruva. Data snapshots may lag; verify with each institution.
        </div>
      </div>
    </footer>
  );
}
