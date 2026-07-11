// Option set labels — mirror entities-and-fields.md exactly.
export type OptionValue = { value: number; label: string };

export const opt = (value: number, label: string): OptionValue => ({ value, label });

export const OPT = {
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
} as const;

export function toOpt<K extends keyof typeof OPT>(
  set: K,
  value: keyof (typeof OPT)[K] | number | null | undefined,
): OptionValue | null {
  if (value == null) return null;
  const label = (OPT[set] as Record<number, string>)[value as number];
  return label ? { value: value as number, label } : null;
}
