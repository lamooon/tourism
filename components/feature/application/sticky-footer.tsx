"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Rocket } from "lucide-react";

export function StickyFooter({
  canPrev,
  canNext,
  onPrev,
  onNext,
  onLaunch,
  disabledReason,
  showLaunch,
  step,
  totalSteps,
}: {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLaunch: () => void;
  disabledReason?: string;
  showLaunch: boolean;
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Step {step} of {totalSteps}
        </div>
        <div className="flex items-center gap-2">
          {canPrev && (
            <Button variant="outline" onClick={onPrev}>
              Back
            </Button>
          )}
          {!showLaunch && (
            <Button
              variant="default"
              className="font-semibold"
              disabled={!canNext}
              onClick={onNext}
            >
              Next
            </Button>
          )}
          {showLaunch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="font-semibold gap-2"
                  onClick={onLaunch}
                  disabled={!!disabledReason}
                >
                  <Rocket className="size-4" /> Launch Agent
                </Button>
              </TooltipTrigger>
              {disabledReason ? (
                <TooltipContent>{disabledReason}</TooltipContent>
              ) : null}
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
