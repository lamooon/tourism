"use client";

import { z } from "zod";

export type TripFormValues = {
  nationalityCode: string;
  destinationCountryAlpha2: string;
  purpose: "Tourist" | "Business";
  from: string;
  to: string;
};

export const TripFormSchema = z.object({
  nationalityCode: z.string().min(1, "Select nationality"),
  destinationCountryAlpha2: z.string().min(1, "Select destination"),
  purpose: z.enum(["Tourist", "Business"]),
  from: z.string().min(1, "Select start date"),
  to: z.string().min(1, "Select end date"),
});
