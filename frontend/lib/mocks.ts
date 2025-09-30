import type {
  Destination,
  VisaTypeLabel,
  ChecklistItem,
  ExtractionResult,
  MappingItem,
  ChecklistCategory,
  DateRange,
} from "@/types/types";

export const DEFAULT_NATIONALITY = "Hong Kong SAR";

export function visaLabelFor(
  destination: Destination | null
): VisaTypeLabel | null {
  switch (destination) {
    case "US":
      return "US B1/B2";
    case "Schengen":
      return "Schengen C Short-Stay";
    case "UK":
      return "UK Standard Visitor";
    default:
      return null;
  }
}

type Rule = {
  id: string;
  title: string;
  category: ChecklistCategory;
  leadDays: number;
  description?: string;
};

const RULES: Record<VisaTypeLabel, Rule[]> = {
  "US B1/B2": [
    {
      id: "ds160",
      title: "Complete DS-160",
      category: "Required",
      leadDays: 30,
      description: "Fill the DS-160 online application form.",
    },
    {
      id: "photo",
      title: "US visa photo (2x2)",
      category: "Required",
      leadDays: 25,
    },
    {
      id: "proof_funds",
      title: "Proof of funds",
      category: "Recommended",
      leadDays: 20,
    },
    {
      id: "schedule",
      title: "Schedule consular interview",
      category: "Required",
      leadDays: 15,
    },
  ],
  "Schengen C Short-Stay": [
    {
      id: "form_c",
      title: "Complete Schengen form",
      category: "Required",
      leadDays: 28,
    },
    {
      id: "photo",
      title: "Schengen visa photo",
      category: "Required",
      leadDays: 22,
    },
    {
      id: "insurance",
      title: "Travel insurance (EUR 30k)",
      category: "Required",
      leadDays: 18,
    },
    {
      id: "proof_funds",
      title: "Proof of funds",
      category: "Recommended",
      leadDays: 20,
    },
  ],
  "UK Standard Visitor": [
    {
      id: "form_v",
      title: "Apply online (UKVI)",
      category: "Required",
      leadDays: 26,
    },
    {
      id: "photo",
      title: "Passport photo per UK spec",
      category: "Required",
      leadDays: 24,
    },
    {
      id: "bank",
      title: "Bank statements (6 months)",
      category: "Recommended",
      leadDays: 18,
    },
  ],
};

export function generateChecklist(
  visaLabel: VisaTypeLabel | null,
  dates: DateRange
): ChecklistItem[] {
  if (!visaLabel) return [];
  const base = RULES[visaLabel];
  const to = dates.to ? new Date(dates.to) : new Date();
  return base.map((rule) => {
    const due = new Date(to);
    due.setDate(due.getDate() - rule.leadDays);
    return {
      id: rule.id,
      title: rule.title,
      description: rule.description ?? "",
      category: rule.category,
      dueDate: due.toISOString().slice(0, 10),
      done: false,
    };
  });
}

// Empty initial state - fields should be empty before upload
export const EMPTY_EXTRACTION: ExtractionResult = {
  mrz: "",
  fullName: "",
  dateOfBirth: "",
  passportNumber: "",
  nationality: "",
  expiry: "",
  address: "",
  bankBalanceHKD: 0,
};

// Mock data for demo - realistic Hong Kong person
export const DEMO_EXTRACTION: ExtractionResult = {
  mrz: "P<HKGWONG<<KA<MING<<<<<<<<<<<<<<<<<<<<<<<<\nH9876543<2HKG9205158M3112295<<<<<<<<<<<<<<04",
  fullName: "WONG Ka Ming",
  dateOfBirth: "1992-05-15",
  passportNumber: "H9876543",
  nationality: "Hong Kong SAR",
  expiry: "2031-12-29",
  address: "Flat B, 25/F, Tower 3, Mei Foo Sun Chuen, Lai Chi Kok, Kowloon, Hong Kong",
  bankBalanceHKD: 285000,
};

// For backwards compatibility
export const MOCK_EXTRACTION = EMPTY_EXTRACTION;

// Empty initial mapping
export const EMPTY_MAPPING: MappingItem[] = [];

// Demo mapping with realistic Hong Kong data
export const DEMO_MAPPING: MappingItem[] = [
  {
    extractedKey: "fullName",
    formField: "applicant_name",
    value: "WONG Ka Ming",
    confidence: "high",
  },
  {
    extractedKey: "dateOfBirth",
    formField: "date_of_birth",
    value: "1992-05-15",
    confidence: "high",
  },
  {
    extractedKey: "passportNumber",
    formField: "passport_number",
    value: "H9876543",
    confidence: "high",
  },
  {
    extractedKey: "nationality",
    formField: "passport_nationality",
    value: "Hong Kong SAR",
    confidence: "high",
  },
  {
    extractedKey: "expiry",
    formField: "passport_expiry",
    value: "2031-12-29",
    confidence: "high",
  },
  {
    extractedKey: "address",
    formField: "residential_address",
    value: "Flat B, 25/F, Tower 3, Mei Foo Sun Chuen, Lai Chi Kok, Kowloon, Hong Kong",
    confidence: "medium",
  },
  {
    extractedKey: "phoneNumber",
    formField: "phone_number",
    value: "+852 92374207",
    confidence: "medium",
  },
  {
    extractedKey: "email",
    formField: "email_address",
    value: "kmwong@gmail.com",
    confidence: "medium",
  },
  {
    extractedKey: "purposeOfTrip",
    formField: "purpose_of_trip",
    value: "Tourism",
    confidence: "low",
  },
  {
    extractedKey: "intendedArrivalDate",
    formField: "arrival_date",
    value: "2025-12-15",
    confidence: "low",
  },
  {
    extractedKey: "intendedDepartureDate",
    formField: "departure_date",
    value: "2026-01-05",
    confidence: "low",
  },
  {
    extractedKey: "bankBalanceHKD",
    formField: "financial_proof_amount",
    value: "285000",
    confidence: "medium",
  },
];

// For backwards compatibility
export const MOCK_MAPPING = EMPTY_MAPPING;
