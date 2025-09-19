export type Destination = "US" | "Schengen" | "UK";
export type Purpose = "Tourist" | "Business";

export type VisaTypeLabel =
  | "US B1/B2"
  | "Schengen C Short-Stay"
  | "UK Standard Visitor";

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface TripSelections {
  nationality: string;
  destination: Destination | null;
  purpose: Purpose | null;
  dates: DateRange;
  visaTypeLabel?: VisaTypeLabel | null;
}

export type ChecklistCategory = "Required" | "Recommended";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  dueDate: string; // ISO date
  done: boolean;
}

export interface ExtractionResult {
  mrz: string;
  fullName: string;
  dateOfBirth: string;
  passportNumber: string;
  nationality: string;
  expiry: string;
  address: string;
  bankBalanceHKD: number;
}

export type Confidence = "low" | "medium" | "high";

export interface MappingItem {
  extractedKey: keyof ExtractionResult;
  formField: string;
  value: string | number;
  confidence: Confidence;
}

export interface UploadMeta {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  status: "Uploaded" | "Previewed";
}

export interface ApplicationMeta {
  id: string;
  destination: Destination | null;
  visaTypeLabel: VisaTypeLabel | null;
  purpose: Purpose | null;
  dates: DateRange;
  progressPct: number;
}
