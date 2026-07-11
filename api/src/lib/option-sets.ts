export type OptionValue = { value: number; label: string };

const maps = {
  institutionType: {
    777770000: "Central University",
    777770001: "State University",
    777770002: "Private University",
    777770003: "Deemed University",
    777770004: "Institute of National Importance",
    777770005: "Affiliated College",
    777770006: "Autonomous College",
    777770007: "Constituent College",
    777770008: "Polytechnic / ITI",
    777770009: "K-12 School",
    777770010: "Coaching Center",
    777770011: "Standalone Institute",
  },
  ownership: {
    777770000: "Government",
    777770001: "Private",
    777770002: "Private-Aided",
    777770003: "Public-Private",
  },
  genderPolicy: {
    777770000: "Co-Ed",
    777770001: "Men Only",
    777770002: "Women Only",
  },
  minorityStatus: {
    777770000: "None",
    777770001: "Muslim",
    777770002: "Christian",
    777770003: "Sikh",
    777770004: "Buddhist",
    777770005: "Jain",
    777770006: "Other",
  },
  naacGrade: {
    777770000: "A++",
    777770001: "A+",
    777770002: "A",
    777770003: "B++",
    777770004: "B+",
    777770005: "B",
    777770006: "C",
    777770007: "Not Accredited",
  },
  degreeLevel: {
    777770000: "UG",
    777770001: "PG",
    777770002: "Diploma",
    777770003: "PhD",
    777770004: "Certificate",
    777770005: "Integrated (UG+PG)",
    777770006: "Post-Diploma",
  },
  academicCalendar: {
    777770000: "Semester",
    777770001: "Trimester",
    777770002: "Annual",
    777770003: "CBCS",
    777770004: "Quarter",
  },
  educationMode: {
    777770000: "Regular",
    777770001: "Distance",
    777770002: "Online",
    777770003: "Hybrid",
    777770004: "Part-Time",
  },
  affiliationType: {
    777770000: "Permanent",
    777770001: "Temporary",
    777770002: "Provisional",
    777770003: "Autonomous",
  },
  approvalStatus: {
    777770000: "Active",
    777770001: "Expired",
    777770002: "Revoked",
    777770003: "Pending Renewal",
  },
  accreditationGrade: {
    777770000: "A++",
    777770001: "A+",
    777770002: "A",
    777770003: "B++",
    777770004: "B+",
    777770005: "B",
    777770006: "C",
    777770007: "Tier I",
    777770008: "Tier II",
  },
  rankingCategory: {
    777770000: "Overall",
    777770001: "University",
    777770002: "College",
    777770003: "Engineering",
    777770004: "Management",
    777770005: "Medical",
    777770006: "Law",
    777770007: "Pharmacy",
    777770008: "Research",
    777770009: "Innovation",
  },
  aliasType: {
    777770000: "Abbr",
    777770001: "Full",
    777770002: "Colloquial",
    777770003: "Regional",
    777770004: "Former",
    777770005: "Acronym",
  },
  feeCategory: {
    777770000: "Tuition",
    777770001: "Hostel",
    777770008: "Total",
  },
  feeFrequency: {
    777770000: "Year",
    777770001: "Semester",
    777770002: "Month",
    777770003: "OneTime",
  },
} as const;

export function toOpt(
  set: keyof typeof maps,
  value: number | null | undefined,
): OptionValue | null {
  if (value == null) return null;
  const label = (maps[set] as Record<number, string>)[value];
  return label ? { value, label } : { value, label: String(value) };
}

export function requireOpt(
  set: keyof typeof maps,
  value: number | null | undefined,
  fallbackLabel = "Unknown",
): OptionValue {
  return toOpt(set, value) ?? { value: value ?? -1, label: fallbackLabel };
}

export function dec(n: { toNumber?: () => number } | number | null | undefined): number | null {
  if (n == null) return null;
  if (typeof n === "number") return n;
  if (typeof n === "object" && typeof n.toNumber === "function") return n.toNumber();
  return Number(n);
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
