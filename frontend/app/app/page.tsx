"use client";

import * as React from "react";
import { Wizard } from "@/components/feature/application/wizard";

export default function AppPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Wizard />
    </React.Suspense>
  );
}
