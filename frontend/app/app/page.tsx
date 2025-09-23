"use client";

import * as React from "react";
import { Wizard } from "@/components/feature/application/wizard";
import {useUser} from "@stackframe/stack";

export default function AppPage() {
  useUser({ or: "redirect" });
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Wizard />
    </React.Suspense>
  );
}
