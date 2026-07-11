// Mock seed data conforming to openapi-public-v1. Extended to 7 institutions,
// mix of Verified/unverified. Only server-side use; safe to import isomorphically.
import { OPT, type OptionValue } from "./option-sets";

const o = <K extends keyof typeof OPT>(set: K, v: keyof (typeof OPT)[K]): OptionValue => ({
  value: v as number,
  label: (OPT[set] as Record<number, string>)[v as number],
});

export type FeeRow = {
  feeCategory: OptionValue;
  amountMin: number | null;
  amountMax: number | null;
  frequency: OptionValue;
  notes: string | null;
  academicYearName: string | null;
};

export type Program = {
  id: string;
  name: string;
  slug: string | null;
  courseName: string | null;
  courseShortName: string | null;
  degreeLevel: OptionValue;
  disciplineName: string | null;
  streamName: string | null;
  schoolName: string | null;
  departmentName: string | null;
  durationYears: number | null;
  educationMode: OptionValue;
  academicCalendar: OptionValue;
  totalSeats: number | null;
  isActive: boolean;
  accreditedByNba: boolean | null;
  nbaValidTill: string | null;
  eligibilityCriteria: string | null;
  admissionProcess: string | null;
  tuitionMin: number | null;
  tuitionMax: number | null;
  totalFeeMin: number | null;
  totalFeeMax: number | null;
  fees: FeeRow[];
};

export type Alias = {
  name: string;
  slug: string | null;
  aliasType: OptionValue;
  isPrimary: boolean;
  redirectToMain: boolean;
};

export type SchoolRow = {
  name: string;
  slug: string | null;
  shortDescription: string | null;
  establishedYear: number | null;
  dean: string | null;
  academicCalendar: OptionValue;
  primaryStreamName: string | null;
  hasLabs: boolean | null;
  hasLibrary: boolean | null;
  hasPlacementCell: boolean | null;
  hasSports: boolean | null;
};

export type RankingRow = {
  rankingBodyName: string;
  academicYearName: string | null;
  category: OptionValue;
  rank: number | null;
  rankBand: string | null;
  score: number | null;
};

export type AccreditationRow = {
  bodyName: string;
  grade: OptionValue;
  cgpaScore: number | null;
  cycleNumber: string | null;
  validFrom: string | null;
  validTill: string | null;
  programName: string | null;
};

export type ApprovalRow = {
  bodyName: string;
  approvalStatus: OptionValue;
  approvalNumber: string | null;
  validFrom: string | null;
  validTill: string | null;
};

export type AffiliationRow = {
  universityName: string;
  affiliationType: OptionValue;
  isCurrent: boolean;
};

export type ExamAcceptedRow = {
  examName: string;
  examShortName: string | null;
  isPrimary: boolean | null;
  weightagePercent: number | null;
  applicableCourseName: string | null;
  academicYearName: string | null;
};

export type InstitutionCard = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  city: string | null;
  state: string | null;
  institutionType: OptionValue;
  ownership: OptionValue;
  naacGrade: OptionValue;
  establishedYear: number | null;
  isFeatured: boolean;
  verified: boolean;
  tuitionMin: number | null;
  tuitionMax: number | null;
  latestOverallRank: number | null;
};

export type InstitutionDetail = InstitutionCard & {
  metaTitle: string | null;
  metaDescription: string | null;
  videoTourUrl: string | null;
  genderPolicy: OptionValue;
  minorityStatus: OptionValue;
  aisheCode: string | null;
  naacValidTill: string | null;
  ugcRecognized: boolean | null;
  aicteApproved: boolean | null;
  addressLine1: string | null;
  addressLine2: string | null;
  district: string | null;
  pincode: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  campusSizeAcres: number | null;
  phone: string | null;
  email: string | null;
  admissionsEmail: string | null;
  website: string | null;
  promotingBody: string | null;
  affiliatedUniversityName: string | null;
  hasPlacementCell: boolean | null;
  hasInternshipSupport: boolean | null;
  hasAlumniNetwork: boolean | null;
  hasGrievanceCell: boolean | null;
  hasAntiRagging: boolean | null;
  hasIcc: boolean | null;
  hasCounselling: boolean | null;
  hasNssNcc: boolean | null;
  hasWifi: boolean | null;
  hasMedical: boolean | null;
  hasSports: boolean | null;
  hasResearchCenter: boolean | null;
  hasIncubation: boolean | null;
  hasTransport: boolean | null;
  updatedAt: string;
  aliases: Alias[];
  schools: SchoolRow[];
  programs: Program[];
  rankings: RankingRow[];
  accreditations: AccreditationRow[];
  approvals: ApprovalRow[];
  affiliations: AffiliationRow[];
  examsAccepted: ExamAcceptedRow[];
  gallery: { mediaUrl: string; thumbnailUrl: string | null; altText: string | null; isFeatured: boolean }[];
  placement: { placementPct: number | null; averagePackage: number | null; highestPackage: number | null } | null;
};

// -------- Seed helpers --------
const yr = "2025-2026";
const ay = "2024-2025";

function baseAmenities(overrides: Partial<InstitutionDetail> = {}) {
  return {
    hasPlacementCell: true,
    hasInternshipSupport: true,
    hasAlumniNetwork: true,
    hasGrievanceCell: true,
    hasAntiRagging: true,
    hasIcc: true,
    hasCounselling: true,
    hasNssNcc: true,
    hasWifi: true,
    hasMedical: true,
    hasSports: true,
    hasResearchCenter: false,
    hasIncubation: false,
    hasTransport: true,
    ...overrides,
  };
}

const cbit: InstitutionDetail = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Chaitanya Bharathi Institute of Technology",
  slug: "cbit-hyderabad",
  shortDescription:
    "Autonomous engineering college in Hyderabad affiliated to Osmania University.",
  metaTitle: "CBIT Hyderabad — Courses, Fees, Rankings | MyGuruva",
  metaDescription:
    "Explore CBIT Hyderabad programs, fees, NAAC grade, admissions exams, and campus amenities.",
  logoUrl: null,
  coverImageUrl: null,
  videoTourUrl: null,
  city: "Hyderabad",
  district: "Hyderabad",
  state: "Telangana",
  pincode: "500075",
  countryName: "India",
  addressLine1: "Gandipet",
  addressLine2: null,
  latitude: 17.392,
  longitude: 78.3195,
  campusSizeAcres: 50.5,
  institutionType: o("institutionType", 777770006),
  ownership: o("ownership", 777770001),
  genderPolicy: o("genderPolicy", 777770000),
  minorityStatus: o("minorityStatus", 777770000),
  establishedYear: 1979,
  aisheCode: "C-12345",
  naacGrade: o("naacGrade", 777770000),
  naacValidTill: "2028-06-30",
  ugcRecognized: true,
  aicteApproved: true,
  phone: "+91-40-24193276",
  email: "principal@cbit.ac.in",
  admissionsEmail: "admissions@cbit.ac.in",
  website: "https://www.cbit.ac.in",
  promotingBody: "CBES",
  affiliatedUniversityName: "Osmania University",
  ...baseAmenities({ hasResearchCenter: true, hasIncubation: true }),
  isFeatured: true,
  verified: true,
  tuitionMin: 140000,
  tuitionMax: 180000,
  latestOverallRank: null,
  updatedAt: "2026-06-01T10:00:00.000Z",
  aliases: [
    { name: "CBIT", slug: "cbit", aliasType: { value: 777770000, label: "Abbr" }, isPrimary: true, redirectToMain: true },
  ],
  schools: [
    {
      name: "School of Engineering",
      slug: "school-of-engineering",
      shortDescription: "Core engineering programs",
      establishedYear: 1979,
      dean: null,
      academicCalendar: { value: 777770000, label: "Semester" },
      primaryStreamName: "Engineering",
      hasLabs: true,
      hasLibrary: true,
      hasPlacementCell: true,
      hasSports: true,
    },
  ],
  programs: [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "B.Tech - Computer Science and Engineering",
      slug: "btech-cse",
      courseName: "Bachelor of Technology",
      courseShortName: "B.Tech",
      degreeLevel: o("degreeLevel", 777770000),
      disciplineName: "Computer Science and Engineering",
      streamName: "Engineering",
      schoolName: "School of Engineering",
      departmentName: "CSE",
      durationYears: 4,
      educationMode: { value: 777770000, label: "Regular" },
      academicCalendar: { value: 777770000, label: "Semester" },
      totalSeats: 180,
      isActive: true,
      accreditedByNba: true,
      nbaValidTill: "2027-06-30",
      eligibilityCriteria: "10+2 with PCM; TS EAMCET / JEE Main",
      admissionProcess: "Counselling via TG EAPCET / JoSAA as applicable",
      tuitionMin: 140000,
      tuitionMax: 160000,
      totalFeeMin: 160000,
      totalFeeMax: 190000,
      fees: [
        {
          feeCategory: { value: 777770000, label: "Tuition" },
          amountMin: 140000,
          amountMax: 160000,
          frequency: { value: 777770000, label: "Year" },
          notes: null,
          academicYearName: yr,
        },
        {
          feeCategory: { value: 777770008, label: "Total" },
          amountMin: 160000,
          amountMax: 190000,
          frequency: { value: 777770000, label: "Year" },
          notes: "Includes tuition and miscellaneous",
          academicYearName: yr,
        },
      ],
    },
  ],
  rankings: [
    {
      rankingBodyName: "NIRF",
      academicYearName: ay,
      category: { value: 777770003, label: "Engineering" },
      rank: 151,
      rankBand: "151-200",
      score: 42.5,
    },
  ],
  accreditations: [
    { bodyName: "NAAC", grade: o("naacGrade", 777770000), cgpaScore: 3.59, cycleNumber: "3rd", validFrom: "2023-07-01", validTill: "2028-06-30", programName: null },
    { bodyName: "NBA", grade: { value: 777770007, label: "Tier I" }, cgpaScore: null, cycleNumber: null, validFrom: "2022-07-01", validTill: "2027-06-30", programName: "B.Tech - Computer Science and Engineering" },
  ],
  approvals: [
    { bodyName: "AICTE", approvalStatus: { value: 777770000, label: "Active" }, approvalNumber: "AICTE-EX-123", validFrom: "2024-07-01", validTill: "2029-06-30" },
  ],
  affiliations: [
    { universityName: "Osmania University", affiliationType: { value: 777770003, label: "Autonomous" }, isCurrent: true },
  ],
  examsAccepted: [
    { examName: "Telangana EAPCET", examShortName: "TG EAPCET", isPrimary: true, weightagePercent: 100, applicableCourseName: "B.Tech - CSE", academicYearName: yr },
    { examName: "Joint Entrance Examination Main", examShortName: "JEE Main", isPrimary: false, weightagePercent: null, applicableCourseName: "B.Tech - CSE", academicYearName: yr },
  ],
  gallery: [],
  placement: { placementPct: 92.5, averagePackage: 750000, highestPackage: 4500000 },
};

const vnit: InstitutionDetail = {
  ...cbit,
  id: "22222222-2222-2222-2222-222222222222",
  name: "Visvesvaraya National Institute of Technology",
  slug: "vnit-nagpur",
  shortDescription: "Institute of National Importance in Nagpur.",
  metaTitle: "VNIT Nagpur — Programs, Rankings & Fees | MyGuruva",
  metaDescription: "Explore VNIT Nagpur B.Tech and M.Tech programs, NIRF rank, tuition and campus facilities.",
  city: "Nagpur",
  district: "Nagpur",
  state: "Maharashtra",
  pincode: "440010",
  addressLine1: "South Ambazari Road",
  latitude: 21.1257,
  longitude: 79.0503,
  institutionType: o("institutionType", 777770004),
  ownership: o("ownership", 777770000),
  establishedYear: 1960,
  aisheCode: "C-44567",
  naacGrade: o("naacGrade", 777770001),
  naacValidTill: "2027-12-31",
  campusSizeAcres: 214,
  promotingBody: "Ministry of Education, GoI",
  affiliatedUniversityName: null,
  website: "https://vnit.ac.in",
  email: "info@vnit.ac.in",
  admissionsEmail: "admissions@vnit.ac.in",
  phone: "+91-712-2801000",
  isFeatured: true,
  verified: true,
  tuitionMin: 125000,
  tuitionMax: 160000,
  latestOverallRank: 41,
  aliases: [
    { name: "VNIT", slug: "vnit", aliasType: { value: 777770000, label: "Abbr" }, isPrimary: true, redirectToMain: true },
  ],
  rankings: [
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770000, label: "Overall" }, rank: 41, rankBand: "41-50", score: 58.2 },
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770003, label: "Engineering" }, rank: 41, rankBand: "41-50", score: 60.1 },
  ],
  affiliations: [],
  placement: { placementPct: null, averagePackage: null, highestPackage: null },
  programs: [
    {
      ...cbit.programs[0]!,
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "B.Tech - Mechanical Engineering",
      slug: "btech-mech",
      disciplineName: "Mechanical Engineering",
      totalSeats: 120,
      tuitionMin: 125000,
      tuitionMax: 140000,
      totalFeeMin: 150000,
      totalFeeMax: 170000,
      fees: [
        { feeCategory: { value: 777770000, label: "Tuition" }, amountMin: 125000, amountMax: 140000, frequency: { value: 777770000, label: "Year" }, notes: null, academicYearName: yr },
      ],
    },
    {
      ...cbit.programs[0]!,
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc",
      name: "B.Tech - Computer Science and Engineering",
      slug: "btech-cse",
      totalSeats: 150,
      tuitionMin: 125000,
      tuitionMax: 160000,
      totalFeeMin: 150000,
      totalFeeMax: 190000,
      fees: [
        { feeCategory: { value: 777770000, label: "Tuition" }, amountMin: 125000, amountMax: 160000, frequency: { value: 777770000, label: "Year" }, notes: null, academicYearName: yr },
      ],
    },
  ],
  examsAccepted: [
    { examName: "Joint Entrance Examination Main", examShortName: "JEE Main", isPrimary: true, weightagePercent: 100, applicableCourseName: "B.Tech (all)", academicYearName: yr },
  ],
  updatedAt: "2026-05-15T08:00:00.000Z",
};

// Non-verified example
const examplePune: InstitutionDetail = {
  ...cbit,
  id: "33333333-3333-3333-3333-333333333333",
  name: "Example Private Engineering College",
  slug: "example-private-engg-pune",
  shortDescription: "Published but not yet JR+SR verified — appears in search without Verified badge.",
  metaTitle: "Example Private Engineering College, Pune | MyGuruva",
  metaDescription: "Programs and fees at an example private engineering college in Pune.",
  city: "Pune",
  district: "Pune",
  state: "Maharashtra",
  pincode: "411041",
  addressLine1: "Katraj",
  latitude: 18.4529,
  longitude: 73.8657,
  institutionType: o("institutionType", 777770005),
  ownership: o("ownership", 777770001),
  establishedYear: 2005,
  naacGrade: o("naacGrade", 777770002),
  naacValidTill: null,
  isFeatured: false,
  verified: false,
  tuitionMin: 90000,
  tuitionMax: 120000,
  latestOverallRank: null,
  aliases: [],
  rankings: [],
  accreditations: [
    { bodyName: "NAAC", grade: o("naacGrade", 777770002), cgpaScore: 3.1, cycleNumber: "2nd", validFrom: "2022-05-01", validTill: "2027-04-30", programName: null },
  ],
  approvals: [
    { bodyName: "AICTE", approvalStatus: { value: 777770000, label: "Active" }, approvalNumber: "AICTE-EX-999", validFrom: "2024-07-01", validTill: "2029-06-30" },
  ],
  affiliations: [
    { universityName: "Savitribai Phule Pune University", affiliationType: { value: 777770000, label: "Permanent" }, isCurrent: true },
  ],
  examsAccepted: [
    { examName: "MHT-CET", examShortName: "MHT-CET", isPrimary: true, weightagePercent: 100, applicableCourseName: "B.Tech (all)", academicYearName: yr },
  ],
  placement: null,
  updatedAt: "2026-04-20T12:00:00.000Z",
  campusSizeAcres: 22,
  affiliatedUniversityName: "Savitribai Phule Pune University",
  promotingBody: null,
  website: "https://example-college.example",
  email: null,
  admissionsEmail: null,
  phone: null,
  programs: [
    {
      ...cbit.programs[0]!,
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "B.Tech - Information Technology",
      disciplineName: "Information Technology",
      totalSeats: 60,
      tuitionMin: 90000,
      tuitionMax: 120000,
      totalFeeMin: 110000,
      totalFeeMax: 140000,
      accreditedByNba: false,
      nbaValidTill: null,
      fees: [
        { feeCategory: { value: 777770000, label: "Tuition" }, amountMin: 90000, amountMax: 120000, frequency: { value: 777770000, label: "Year" }, notes: null, academicYearName: yr },
      ],
    },
  ],
};

const iitb: InstitutionDetail = {
  ...vnit,
  id: "44444444-4444-4444-4444-444444444444",
  name: "Indian Institute of Technology Bombay",
  slug: "iit-bombay",
  shortDescription: "Premier Institute of National Importance in Mumbai.",
  metaTitle: "IIT Bombay — Courses, Cutoffs, Rankings | MyGuruva",
  metaDescription: "Explore IIT Bombay's B.Tech, M.Tech and dual-degree programs, JEE cutoffs, and campus.",
  city: "Mumbai",
  district: "Mumbai Suburban",
  state: "Maharashtra",
  pincode: "400076",
  addressLine1: "Powai",
  latitude: 19.1334,
  longitude: 72.9133,
  institutionType: o("institutionType", 777770004),
  ownership: o("ownership", 777770000),
  establishedYear: 1958,
  aisheCode: "C-11111",
  naacGrade: o("naacGrade", 777770000),
  naacValidTill: "2029-06-30",
  campusSizeAcres: 550,
  website: "https://www.iitb.ac.in",
  isFeatured: true,
  verified: true,
  tuitionMin: 220000,
  tuitionMax: 250000,
  latestOverallRank: 3,
  aliases: [
    { name: "IITB", slug: "iitb", aliasType: { value: 777770000, label: "Abbr" }, isPrimary: true, redirectToMain: true },
  ],
  rankings: [
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770000, label: "Overall" }, rank: 3, rankBand: "1-10", score: 83.1 },
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770003, label: "Engineering" }, rank: 3, rankBand: "1-10", score: 89.8 },
  ],
  placement: { placementPct: 87.4, averagePackage: 2150000, highestPackage: 32000000 },
  updatedAt: "2026-06-10T08:00:00.000Z",
};

const iimb: InstitutionDetail = {
  ...vnit,
  id: "55555555-5555-5555-5555-555555555555",
  name: "Indian Institute of Management Bangalore",
  slug: "iim-bangalore",
  shortDescription: "Top-ranked management institute in Bengaluru offering PGP and doctoral programs.",
  metaTitle: "IIM Bangalore — PGP, Fees, Rankings | MyGuruva",
  metaDescription: "IIM Bangalore programs, tuition, CAT cutoffs, placements and campus facilities.",
  city: "Bengaluru",
  district: "Bengaluru Urban",
  state: "Karnataka",
  pincode: "560076",
  addressLine1: "Bannerghatta Road",
  latitude: 12.8933,
  longitude: 77.6035,
  institutionType: o("institutionType", 777770004),
  ownership: o("ownership", 777770000),
  establishedYear: 1973,
  aisheCode: "C-22222",
  naacGrade: o("naacGrade", 777770000),
  campusSizeAcres: 100,
  website: "https://www.iimb.ac.in",
  isFeatured: true,
  verified: true,
  tuitionMin: 2400000,
  tuitionMax: 2500000,
  latestOverallRank: 8,
  aliases: [
    { name: "IIMB", slug: "iimb", aliasType: { value: 777770000, label: "Abbr" }, isPrimary: true, redirectToMain: true },
  ],
  rankings: [
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770004, label: "Management" }, rank: 2, rankBand: "1-10", score: 82.4 },
  ],
  programs: [
    {
      ...cbit.programs[0]!,
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      name: "Post Graduate Programme in Management",
      slug: "pgp",
      courseName: "Master of Business Administration",
      courseShortName: "MBA",
      degreeLevel: o("degreeLevel", 777770001),
      disciplineName: "Management",
      streamName: "Management",
      schoolName: null,
      departmentName: null,
      totalSeats: 550,
      tuitionMin: 2400000,
      tuitionMax: 2500000,
      totalFeeMin: 2500000,
      totalFeeMax: 2600000,
      eligibilityCriteria: "Bachelor's degree with 50%; valid CAT score.",
      admissionProcess: "CAT + WAT + PI",
      accreditedByNba: null,
      nbaValidTill: null,
      fees: [
        { feeCategory: { value: 777770008, label: "Total" }, amountMin: 2500000, amountMax: 2600000, frequency: { value: 777770004, label: "Total" }, notes: "Two-year programme", academicYearName: yr },
      ],
    },
  ],
  examsAccepted: [
    { examName: "Common Admission Test", examShortName: "CAT", isPrimary: true, weightagePercent: 100, applicableCourseName: "PGP", academicYearName: yr },
  ],
  affiliations: [],
  placement: { placementPct: 100, averagePackage: 3510000, highestPackage: 10000000 },
  updatedAt: "2026-05-30T08:00:00.000Z",
};

const dyPatilPune: InstitutionDetail = {
  ...examplePune,
  id: "66666666-6666-6666-6666-666666666666",
  name: "Symbiosis Institute of Technology",
  slug: "sit-pune",
  shortDescription: "Constituent institute of Symbiosis International (Deemed University), Pune.",
  metaTitle: "Symbiosis Institute of Technology, Pune | MyGuruva",
  metaDescription: "SIT Pune B.Tech programs, SET admissions, fees and campus overview.",
  institutionType: o("institutionType", 777770003),
  ownership: o("ownership", 777770001),
  establishedYear: 2008,
  naacGrade: o("naacGrade", 777770001),
  isFeatured: true,
  verified: true,
  tuitionMin: 320000,
  tuitionMax: 380000,
  latestOverallRank: 128,
  aliases: [{ name: "SIT", slug: "sit", aliasType: { value: 777770000, label: "Abbr" }, isPrimary: true, redirectToMain: true }],
  updatedAt: "2026-06-05T08:00:00.000Z",
  rankings: [
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770003, label: "Engineering" }, rank: 128, rankBand: "101-150", score: 45.2 },
  ],
  affiliations: [{ universityName: "Symbiosis International University", affiliationType: { value: 777770003, label: "Autonomous" }, isCurrent: true }],
  examsAccepted: [
    { examName: "Symbiosis Entrance Test", examShortName: "SET", isPrimary: true, weightagePercent: 100, applicableCourseName: "B.Tech (all)", academicYearName: yr },
  ],
  placement: { placementPct: 88.2, averagePackage: 620000, highestPackage: 2400000 },
};

const amritaCbe: InstitutionDetail = {
  ...cbit,
  id: "77777777-7777-7777-7777-777777777777",
  name: "Amrita Vishwa Vidyapeetham",
  slug: "amrita-coimbatore",
  shortDescription: "Deemed multi-campus university with main campus at Coimbatore.",
  metaTitle: "Amrita Vishwa Vidyapeetham, Coimbatore | MyGuruva",
  metaDescription: "Amrita University programs, fees, NIRF rank and admissions.",
  city: "Coimbatore",
  district: "Coimbatore",
  state: "Tamil Nadu",
  pincode: "641112",
  addressLine1: "Ettimadai",
  latitude: 10.9004,
  longitude: 76.9033,
  institutionType: o("institutionType", 777770003),
  ownership: o("ownership", 777770001),
  establishedYear: 2003,
  naacGrade: o("naacGrade", 777770000),
  campusSizeAcres: 400,
  website: "https://www.amrita.edu",
  isFeatured: false,
  verified: true,
  tuitionMin: 300000,
  tuitionMax: 340000,
  latestOverallRank: 23,
  aliases: [],
  rankings: [
    { rankingBodyName: "NIRF", academicYearName: ay, category: { value: 777770000, label: "Overall" }, rank: 23, rankBand: "21-30", score: 66.5 },
  ],
  updatedAt: "2026-05-20T08:00:00.000Z",
};

export const INSTITUTIONS: InstitutionDetail[] = [
  cbit,
  vnit,
  examplePune,
  iitb,
  iimb,
  dyPatilPune,
  amritaCbe,
];

// -------- Taxonomies --------
export const STREAMS = [
  { id: "s1", name: "Engineering", shortName: "Engg", slug: "engineering" },
  { id: "s2", name: "Management", shortName: "Mgmt", slug: "management" },
  { id: "s3", name: "Pharmacy", shortName: null, slug: "pharmacy" },
];

export const COURSES = [
  { id: "c1", name: "Bachelor of Technology", shortName: "B.Tech", slug: "btech", degreeLevel: o("degreeLevel", 777770000) },
  { id: "c2", name: "Master of Business Administration", shortName: "MBA", slug: "mba", degreeLevel: o("degreeLevel", 777770001) },
];

export const LOCATIONS = [
  { id: "loc-in", name: "India", locationType: "country" as const, parentId: null, isMetro: null },
  { id: "loc-ts", name: "Telangana", locationType: "state" as const, parentId: "loc-in", isMetro: null },
  { id: "loc-mh", name: "Maharashtra", locationType: "state" as const, parentId: "loc-in", isMetro: null },
  { id: "loc-ka", name: "Karnataka", locationType: "state" as const, parentId: "loc-in", isMetro: null },
  { id: "loc-tn", name: "Tamil Nadu", locationType: "state" as const, parentId: "loc-in", isMetro: null },
];

export const EXAMS = [
  { id: "e1", name: "Joint Entrance Examination Main", shortName: "JEE Main", slug: "jee-main" },
  { id: "e2", name: "Telangana EAPCET", shortName: "TG EAPCET", slug: "tg-eapcet" },
  { id: "e3", name: "Common Admission Test", shortName: "CAT", slug: "cat" },
];

export const RANKING_BODIES = [
  { id: "rb1", name: "National Institutional Ranking Framework", shortName: "NIRF", slug: "nirf" },
];
