import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getInstitutionBySlug } from "@/lib/api-service";
import type { InstitutionDetail } from "@/lib/mock-data";
import { VerifiedBadge } from "@/components/college-card";
import { CompareToggle } from "@/components/compare-toggle";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await getInstitutionBySlug(slug);
  if (r.kind !== "detail") {
    return { title: "College", robots: { index: false } };
  }
  const d = r.data;
  const title = d.metaTitle ?? d.name;
  const description =
    d.metaDescription ?? d.description ?? d.shortDescription ?? `${d.name} — programs, fees, rankings and admissions.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/colleges/${d.slug}`,
    },
    alternates: { canonical: `/colleges/${d.slug}` },
  };
}

function fmtFee(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}k`;
}

export default async function CollegeDetailPage({ params }: Props) {
  const { slug } = await params;
  const r = await getInstitutionBySlug(slug);
  if (r.kind === "notFound") notFound();
  if (r.kind === "redirect") redirect(`/colleges/${r.primarySlug}`);
  const d = r.data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: d.name,
    url: d.website ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: [d.addressLine1, d.addressLine2].filter(Boolean).join(", ") || undefined,
      addressLocality: d.city ?? undefined,
      addressRegion: d.state ?? undefined,
      postalCode: d.pincode ?? undefined,
      addressCountry: d.countryName ?? undefined,
    },
    foundingDate: d.establishedYear ? String(d.establishedYear) : undefined,
    telephone: d.phone ?? undefined,
    email: d.email ?? undefined,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DetailBody d={d} />
    </div>
  );
}

function DetailBody({ d }: { d: InstitutionDetail }) {
  const overview = d.description?.trim() || d.shortDescription?.trim() || "";
  const address = [d.addressLine1, d.addressLine2, d.addressLine3, d.city, d.district, d.state, d.pincode, d.countryName]
    .filter(Boolean)
    .join(", ");
  const alsoKnownAs = (d.aliases ?? []).map((a) => a.name).filter(Boolean);
  const hostels = d.hostels ?? [];
  const infrastructure = d.infrastructure ?? [];
  const institutionFees = d.institutionFees ?? [];
  const medium = d.mediumOfInstruction ?? [];
  const amenities: Array<[string, boolean | null]> = [
    ["Placement cell", d.hasPlacementCell],
    ["Internship support", d.hasInternshipSupport],
    ["Alumni network", d.hasAlumniNetwork],
    ["Grievance cell", d.hasGrievanceCell],
    ["Anti-ragging", d.hasAntiRagging],
    ["ICC", d.hasIcc],
    ["Counselling", d.hasCounselling],
    ["NSS / NCC", d.hasNssNcc],
    ["Wi-Fi", d.hasWifi],
    ["Medical", d.hasMedical],
    ["Sports", d.hasSports],
    ["Research center", d.hasResearchCenter],
    ["Incubation", d.hasIncubation],
    ["Transport", d.hasTransport],
  ];

  return (
    <div>
      <section className="border-b border-border/60 bg-gradient-to-b from-[color:var(--saffron)]/10 to-transparent">
        <div className="container-page py-10">
          <div className="text-xs text-muted-foreground">
            <Link href="/colleges" className="hover:text-foreground">Colleges</Link>
            {d.state ? ` · ${d.state}` : ""}
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl leading-tight md:text-5xl">{d.name}</h1>
              <div className="mt-2 text-muted-foreground">
                {[d.city, d.district, d.state].filter(Boolean).join(", ")}
                {d.establishedYear ? ` · Est. ${d.establishedYear}` : ""}
              </div>
            </div>
            {d.verified ? <VerifiedBadge /> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Chip opt={d.institutionType} />
            <Chip opt={d.ownership} />
            <Chip opt={d.genderPolicy} />
            {known(d.naacGrade) ? <span className="chip">NAAC {d.naacGrade.label}</span> : null}
            {d.aicteApproved ? <span className="chip">AICTE Approved</span> : null}
            {d.ugcRecognized ? <span className="chip">UGC Recognized</span> : null}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <Section id="overview" title="Overview">
            {overview ? (
              <p className="whitespace-pre-wrap text-foreground/90">{overview}</p>
            ) : (
              <Empty>No overview has been added for this institution yet.</Empty>
            )}
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-3">
              <Fact label="Campus size" value={d.campusSizeAcres != null ? `${d.campusSizeAcres} acres` : "—"} />
              <Fact label="Affiliated to" value={d.affiliatedUniversityName ?? "—"} />
              <Fact label="Promoting body" value={d.promotingBody ?? "—"} />
              <Fact label="AISHE code" value={d.aisheCode ?? "—"} />
              <Fact label="NAAC grade" value={known(d.naacGrade) ? d.naacGrade.label : "—"} />
              <Fact label="NAAC valid till" value={fmtDate(d.naacValidTill)} />
              <Fact label="Established" value={d.establishedYear ?? "—"} />
              <Fact label="Institution type" value={known(d.institutionType) ? d.institutionType.label : "—"} />
              <Fact label="Ownership" value={known(d.ownership) ? d.ownership.label : "—"} />
              <Fact label="Gender policy" value={known(d.genderPolicy) ? d.genderPolicy.label : "—"} />
              <Fact label="Minority status" value={known(d.minorityStatus) ? d.minorityStatus.label : "—"} />
              <Fact label="Education level" value={known(d.educationLevel) ? d.educationLevel.label : "—"} />
              <Fact label="Board affiliation" value={known(d.boardAffiliation) ? d.boardAffiliation.label : "—"} />
              <Fact
                label="Medium of instruction"
                value={medium.length ? medium.map((m) => m.label).join(", ") : "—"}
              />
              <Fact label="UGC recognized" value={boolLabel(d.ugcRecognized)} />
              <Fact label="AICTE approved" value={boolLabel(d.aicteApproved)} />
              <Fact
                label="Website"
                value={
                  d.website ? (
                    <a className="text-primary hover:underline" href={d.website} target="_blank" rel="noreferrer">
                      {d.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Fact
                label="Video tour"
                value={
                  d.videoTourUrl ? (
                    <a className="text-primary hover:underline" href={d.videoTourUrl} target="_blank" rel="noreferrer">
                      Watch
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Fact label="Also known as" value={alsoKnownAs.length ? alsoKnownAs.join(", ") : "—"} />
              <Fact label="Address" value={address || "—"} />
            </dl>
          </Section>

          <Section id="programs" title="Courses & Fees">
            {d.programs.length === 0 ? (
              <Empty>No programs listed yet.</Empty>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3">Program</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Seats</th>
                      <th className="px-4 py-3">Tuition / yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.programs.map((p) => (
                      <tr key={p.id} className="border-t border-border align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[p.streamName, p.disciplineName, p.schoolName, p.departmentName].filter(Boolean).join(" · ")}
                          </div>
                          {p.fees.length > 0 ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {p.fees.map((f, idx) => (
                                <div key={idx}>
                                  {f.feeCategory.label}: {fmtFee(f.amountMin)}
                                  {f.amountMax != null && f.amountMax !== f.amountMin ? ` – ${fmtFee(f.amountMax)}` : ""}
                                  {known(f.frequency) ? ` / ${f.frequency.label}` : ""}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{known(p.degreeLevel) ? p.degreeLevel.label : "—"}</td>
                        <td className="px-4 py-3">{known(p.educationMode) ? p.educationMode.label : "—"}</td>
                        <td className="px-4 py-3">{p.durationYears ? `${p.durationYears} yrs` : "—"}</td>
                        <td className="px-4 py-3">{p.totalSeats ?? "—"}</td>
                        <td className="px-4 py-3">
                          {fmtFee(p.tuitionMin)}
                          {p.tuitionMax && p.tuitionMax !== p.tuitionMin ? ` – ${fmtFee(p.tuitionMax)}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {institutionFees.length > 0 && d.programs.every((p) => p.fees.length === 0) ? (
              <div className="mt-4 text-sm text-muted-foreground">
                Institution fee rows:{" "}
                {institutionFees.map((f) => `${f.feeCategory.label} ${fmtFee(f.amountMin)}`).join(" · ")}
              </div>
            ) : null}
          </Section>

          <Section id="rankings" title="Rankings">
            {d.rankings.length === 0 ? (
              <Empty>No rankings published for this institution.</Empty>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {d.rankings.map((r, idx) => (
                  <li key={idx} className="rounded-lg border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">
                      {r.rankingBodyName}
                      {known(r.category) ? ` · ${r.category.label}` : ""}
                      {r.academicYearName ? ` · ${r.academicYearName}` : ""}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-3xl">{r.rank ?? "—"}</span>
                      {r.rankBand && <span className="text-xs text-muted-foreground">band {r.rankBand}</span>}
                      {r.score != null && (
                        <span className="ml-auto text-xs text-muted-foreground">score {r.score}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="quality" title="Quality — Accreditation, Approvals, Affiliations">
            <div className="grid gap-6 md:grid-cols-3">
              <QualityBlock
                title="Accreditation"
                rows={d.accreditations.map((a) => {
                  const parts = [a.bodyName, known(a.grade) ? a.grade.label : null, a.cgpaScore != null ? `CGPA ${a.cgpaScore}` : null]
                    .filter(Boolean);
                  const dates = [a.validFrom ? `from ${fmtDate(a.validFrom)}` : null, a.validTill ? `till ${fmtDate(a.validTill)}` : null]
                    .filter(Boolean)
                    .join(" ");
                  return `${parts.join(" — ")}${dates ? ` (${dates})` : ""}`;
                })}
              />
              <QualityBlock
                title="Approvals"
                rows={d.approvals.map((a) => {
                  const status = known(a.approvalStatus) ? a.approvalStatus.label : null;
                  const num = a.approvalNumber ? `#${a.approvalNumber}` : null;
                  return [a.bodyName, status, num].filter(Boolean).join(" — ");
                })}
              />
              <QualityBlock
                title="Affiliations"
                rows={d.affiliations.map((a) => {
                  const typ = known(a.affiliationType) ? a.affiliationType.label : null;
                  return [a.universityName, typ, a.isCurrent ? "Current" : null].filter(Boolean).join(" — ");
                })}
              />
            </div>
          </Section>

          <Section id="admissions" title="Admissions — Exams">
            {d.examsAccepted.length === 0 ? (
              <Empty>No entrance exams recorded.</Empty>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {d.examsAccepted.map((e, idx) => (
                  <li key={idx} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="font-medium">{e.examShortName ?? e.examName}</div>
                      <div className="text-xs text-muted-foreground">
                        {[e.applicableCourseName ?? "All programs", e.academicYearName].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {e.isPrimary ? <span className="chip mr-2">Primary</span> : null}
                      {e.weightagePercent != null ? `${e.weightagePercent}%` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {d.programs.some((p) => p.eligibilityCriteria || p.admissionProcess) ? (
              <div className="mt-6 space-y-3 text-sm">
                {d.programs
                  .filter((p) => p.eligibilityCriteria || p.admissionProcess)
                  .map((p) => (
                    <div key={p.id} className="rounded-lg border border-border p-4">
                      <div className="font-medium">{p.name}</div>
                      {p.eligibilityCriteria ? (
                        <p className="mt-1 text-muted-foreground">Eligibility: {p.eligibilityCriteria}</p>
                      ) : null}
                      {p.admissionProcess ? (
                        <p className="mt-1 text-muted-foreground">Process: {p.admissionProcess}</p>
                      ) : null}
                    </div>
                  ))}
              </div>
            ) : null}
          </Section>

          <Section id="campus" title="Campus & amenities">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 md:grid-cols-4">
              {amenities.map(([label, v]) => (
                <Fact key={label} label={label} value={boolLabel(v)} />
              ))}
            </dl>
            {hostels.length > 0 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium">Hostels</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {hostels.map((h, idx) => (
                    <li key={idx} className="rounded-lg border border-border p-4 text-sm">
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[known(h.hostelType) ? h.hostelType.label : null, h.totalCapacity ? `${h.totalCapacity} seats` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      {h.annualFeeMin != null ? (
                        <div className="mt-1 text-muted-foreground">Fee {fmtFee(h.annualFeeMin)}–{fmtFee(h.annualFeeMax)}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {infrastructure.length > 0 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium">Infrastructure</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {infrastructure.map((inf, idx) => (
                    <li key={idx} className="rounded-lg border border-border p-4 text-sm">
                      <div className="font-medium">{inf.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {known(inf.facilityType) ? inf.facilityType.label : ""}
                        {inf.capacity ? ` · capacity ${inf.capacity}` : ""}
                      </div>
                      {inf.description ? <p className="mt-1 text-muted-foreground">{inf.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {d.gallery.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {d.gallery.map((g, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={g.mediaUrl}
                    alt={g.altText ?? d.name}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground">Tuition (per year)</div>
            <div className="font-display mt-1 text-2xl">
              {fmtFee(d.tuitionMin)}
              {d.tuitionMax && d.tuitionMax !== d.tuitionMin ? ` – ${fmtFee(d.tuitionMax)}` : ""}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Fact label="NIRF" value={d.latestOverallRank ?? "—"} />
              <Fact label="NAAC" value={known(d.naacGrade) ? d.naacGrade.label : "—"} />
              {d.placement?.placementPct != null && (
                <Fact label="Placement" value={`${d.placement.placementPct}%`} />
              )}
              {d.placement?.averagePackage != null && (
                <Fact label="Avg package" value={fmtFee(d.placement.averagePackage)} />
              )}
            </div>
            <div className="mt-5">
              <CompareToggle
                item={{ slug: d.slug, name: d.name, city: d.city, state: d.state }}
                verified={d.verified}
                className="w-full"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-sm">
            <div className="font-medium">Contact</div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              {d.phone && <div>{d.phone}</div>}
              {d.email && <div>{d.email}</div>}
              {d.admissionsEmail && <div>Admissions: {d.admissionsEmail}</div>}
              {address ? <div className="pt-1">{address}</div> : null}
              {!d.phone && !d.email && !address && <div>No public contact details.</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function known(opt: { value: number; label: string } | null | undefined) {
  return !!opt && opt.value !== -1 && opt.label !== "Unknown";
}

function Chip({ opt, prefix }: { opt: { value: number; label: string }; prefix?: string }) {
  if (!known(opt)) return null;
  return <span className="chip">{prefix ? `${prefix} ${opt.label}` : opt.label}</span>;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function boolLabel(v: boolean | null | undefined) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h2 className="font-display mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  );
}
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
function QualityBlock({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{title}</div>
      {rows.length === 0 ? (
        <div className="mt-2 text-sm text-muted-foreground">—</div>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm">
          {rows.map((r, idx) => (
            <li key={idx}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{children}</div>;
}
