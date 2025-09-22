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

export const MOCK_EXTRACTION: ExtractionResult = {
  mrz: "P<HKGLEE<<JIAHUI<<<<<<<<<<<<<<<<<<<<<<<<<<<\nH1234567<8HKG8501012F3001012<<<<<<<<<<<<<<06",
  fullName: "LEE JIA HUI",
  dateOfBirth: "1985-01-01",
  passportNumber: "H1234567",
  nationality: "HKG",
  expiry: "2030-01-01",
  address: "12F, Example Tower, Central, Hong Kong",
  bankBalanceHKD: 180000,
};

export const MOCK_MAPPING: MappingItem[] = [
  {
    extractedKey: "fullName",
    formField: "applicant_name",
    value: "LEE JIA HUI",
    confidence: "high",
  },
  {
    extractedKey: "dateOfBirth",
    formField: "dob",
    value: "1985-01-01",
    confidence: "high",
  },
  {
    extractedKey: "passportNumber",
    formField: "passport_no",
    value: "H1234567",
    confidence: "medium",
  },
];
