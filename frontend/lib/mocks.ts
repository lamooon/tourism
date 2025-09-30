import type {
  Destination,
  VisaTypeLabel,
  ChecklistItem,
  ExtractionResult,
  MappingItem,
  ChecklistCategory,
  DateRange,
} from "@/types/types";

export const DEFAULT_NATIONALITY = "China";

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
      id: "passport_bio_scan",
      title: "Passport biodata page scan",
      category: "Required",
      leadDays: 28,
      description:
        "Clear color scan of the passport biodata page (valid 6+ months, 1+ blank page)",
    },
    {
      id: "hkid_copy",
      title: "HKID copy",
      category: "Required",
      leadDays: 25,
      description: "Copy of Hong Kong Identity Card (for HK SAR applicants)",
    },
    {
      id: "application_payment",
      title: "Visa application payment/booking confirmation",
      category: "Required",
      leadDays: 28,
      description: "PDF receipt or booking confirmation from UKVI",
    },
    {
      id: "accommodation",
      title: "Accommodation booking or host address",
      category: "Required",
      leadDays: 21,
      description: "Hotel booking OR full UK host address and dates",
    },
    {
      id: "flight_reservation",
      title: "Flight reservation / draft itinerary",
      category: "Recommended",
      leadDays: 14,
      description:
        "No purchase required; provide a reservation or proposed itinerary",
    },
    {
      id: "trip_plan",
      title: "Short trip plan/itinerary",
      category: "Recommended",
      leadDays: 14,
      description: "Outline where you will visit and on which dates",
    },
    {
      id: "bank_statements",
      title: "Bank statements (last 6 months)",
      category: "Required",
      leadDays: 20,
      description: "Download official e-statements or stamped statements",
    },
    {
      id: "payslips",
      title: "Payslips (3–6 months) or business proofs",
      category: "Required",
      leadDays: 20,
      description:
        "If self-employed: BR cert, tax returns, invoices, bank in/out",
    },
    {
      id: "employer_letter",
      title: "Employer letter (role, salary, approved leave)",
      category: "Required",
      leadDays: 18,
      description: "On company letterhead with contact details and signature",
    },
    {
      id: "sponsor_docs",
      title: "Sponsorship documents (if sponsored)",
      category: "Recommended",
      leadDays: 18,
      description: "Sponsor letter, bank statements, and ID/status copy",
    },
    {
      id: "ties_employment",
      title: "Employment contract / confirmation of employment",
      category: "Recommended",
      leadDays: 16,
    },
    {
      id: "ties_property",
      title: "Property deed / tenancy / business ownership proof",
      category: "Recommended",
      leadDays: 16,
    },
    {
      id: "previous_visas",
      title: "Previous visas and travel history",
      category: "Recommended",
      leadDays: 12,
      description: "Scans of visas/stamps, especially UK/Schengen/US if any",
    },
    {
      id: "travel_insurance",
      title: "Travel insurance (recommended)",
      category: "Recommended",
      leadDays: 10,
    },
    {
      id: "cover_letter",
      title: "Cover letter (purpose, dates, funding, ties)",
      category: "Recommended",
      leadDays: 12,
    },
    {
      id: "invitation_letter",
      title: "Invitation letter + host’s UK status + relationship proof",
      category: "Recommended",
      leadDays: 21,
      description: "Only if visiting friends/family",
    },
    {
      id: "minors_documents",
      title: "Minors: birth certificate and parental consent",
      category: "Recommended",
      leadDays: 25,
      description:
        "If the applicant is under 18 or travelling with one parent/guardian",
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
  phoneNumber: "",
  bankBalanceHKD: 0,
};

// Mock data for demo - realistic China national
export const DEMO_EXTRACTION: ExtractionResult = {
  mrz: "P<CHNWANG<<XIAOMING<<<<<<<<<<<<<<<<<<<<<<<\nG12345678<3CHN9001012M3001012<<<<<<<<<<<<<<08",
  fullName: "WONG Ka Ming",
  dateOfBirth: "1992-05-15",
  passportNumber: "G12345678",
  nationality: "China",
  expiry: "2031-12-29",
  address: "Room 1203, Tower 2, Jianguo Garden, Chaoyang, Beijing, China",
  phoneNumber: "+852 9237 4207",
  bankBalanceHKD: 285000,
};

// For backwards compatibility
export const MOCK_EXTRACTION = EMPTY_EXTRACTION;

// Empty initial mapping
export const EMPTY_MAPPING: MappingItem[] = [];

// Demo mapping with realistic China applicant data
export const DEMO_MAPPING: MappingItem[] = [
  {
    extractedKey: "fullName",
    formField: "applicant_name",
    value: "WONG Ka Ming",
  },
  {
    extractedKey: "dateOfBirth",
    formField: "date_of_birth",
    value: "1992-05-15",
  },
  {
    extractedKey: "passportNumber",
    formField: "passport_number",
    value: "H9876543",
  },
  {
    extractedKey: "nationality",
    formField: "passport_nationality",
    value: "China",
  },
  {
    extractedKey: "expiry",
    formField: "passport_expiry",
    value: "2031-12-29",
  },
  {
    extractedKey: "address",
    formField: "residential_address",
    value: "Room 1203, Tower 2, Jianguo Garden, Chaoyang, Beijing, China",
  },
  {
    extractedKey: "phoneNumber",
    formField: "phone_number",
    value: "+852 92374207",
  },
  {
    extractedKey: "fullName",
    formField: "email_address",
    value: "kmwong@gmail.com",
  },
  {
    extractedKey: "nationality",
    formField: "purpose_of_trip",
    value: "Tourism",
  },
  {
    extractedKey: "expiry",
    formField: "arrival_date",
    value: "2025-12-15",
  },
  {
    extractedKey: "expiry",
    formField: "departure_date",
    value: "2026-01-05",
  },
  {
    extractedKey: "bankBalanceHKD",
    formField: "financial_proof_amount",
    value: "285000",
  },
];

// For backwards compatibility
export const MOCK_MAPPING = EMPTY_MAPPING;
