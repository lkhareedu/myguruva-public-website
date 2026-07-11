import Link from "next/link";

export default function CollegeNotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl">College not found</h1>
      <p className="mt-2 text-muted-foreground">This college is not published, or the URL is wrong.</p>
      <Link
        href="/colleges"
        className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Browse colleges
      </Link>
    </div>
  );
}
