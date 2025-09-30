"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function LaunchAgent() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-6 min-h-[240px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-2xl font-semibold">All set!</div>
          <div className="text-sm text-muted-foreground">
            Your application has been filled.
          </div>
          <Button asChild className="mt-2">
            <a href="/filled.pdf" download>
              Download filled PDF
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
