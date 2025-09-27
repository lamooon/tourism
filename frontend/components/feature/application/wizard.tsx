"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StickyFooter } from "@/components/feature/application/sticky-footer";
import { TripSetup } from "@/components/feature/application/trip-setup";
import { Checklist } from "@/components/feature/application/checklist";
import { UploadAndFill } from "@/components/feature/application/upload-and-fill";
import { LaunchAgent } from "@/components/feature/application/launch-agent";
import {
  TripFormSchema,
  type TripFormValues,
} from "@/components/feature/application/trip-form";
import { useUser } from "@stackframe/stack";

export function Wizard() {
  useUser({ or: "redirect" });
  const user = useUser();
  const { state, loadApplication, createApplication } = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const appId = sp.get("appId");
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  const tripForm = useForm<TripFormValues>({
    resolver: zodResolver(TripFormSchema),
    defaultValues: {
      nationalityCode: state.trip?.nationalityCode ?? "",
      destinationCountryAlpha2: state.trip?.destinationCountryAlpha2 ?? "",
      purpose: (state.trip?.purpose as "Tourist" | "Business") ?? "Tourist",
      from: state.trip?.dates.from ?? "",
      to: state.trip?.dates.to ?? "",
    },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    const isNew = sp.get("new") === "1";
    if (isNew) {
      const id = createApplication();
      router.replace(`/app?appId=${id}`);
      return;
    }
    if (appId) {
      loadApplication(appId);
      return;
    }
    if (!state.currentAppId) {
      const id = createApplication();
      router.replace(`/app?appId=${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  React.useEffect(() => {
    if (!state.trip) return;
    tripForm.reset({
      nationalityCode: state.trip.nationalityCode ?? "",
      destinationCountryAlpha2: state.trip.destinationCountryAlpha2 ?? "",
      purpose: (state.trip.purpose as "Tourist" | "Business") ?? "Tourist",
      from: state.trip.dates.from ?? "",
      to: state.trip.dates.to ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.trip]);

  const requirements: string[] = [];
  const reqIds = state.checklist
    .filter((i) => i.category === "Required")
    .map((i) => i.id);
  const allRequiredDone = reqIds.every((id) => state.checklistState[id]);
  if (!allRequiredDone)
    requirements.push("Complete all Required checklist items");
  if (!state.uploads.length)
    requirements.push("Upload at least one identity document");

  async function handleNext() {
    if (step === 1) {
      const ok = await tripForm.trigger(undefined, { shouldFocus: true });
      if (!ok) {
        toast.error("Please complete required fields.");
        return;
      }

      // 🚀 Persist trip to backend if not already created
      if (!state.trip?.id) {
        try {
          const values = tripForm.getValues();
          console.log("creating trip with userId:", user?.id);
          const res = await fetch("/api/trips/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nationality: values.nationalityCode,
              destination: values.destinationCountryAlpha2,
              purpose: values.purpose,
              departure_date: values.from,
              arrival_date: values.to,
              userId: user?.id
            }),
          });

          if (!res.ok) throw new Error("Failed to create trip");
          const trip = await res.json();

          // update global context with this trip id
          loadApplication(trip.id);
          toast.success("Trip created!");
        } catch (err) {
          console.error(err);
          toast.error("Could not save trip");
          return;
        }
      }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  }

  const steps = [
    { id: 1, title: "Trip Setup" },
    { id: 2, title: "Checklist" },
    { id: 3, title: "Upload & Fill" },
    { id: 4, title: "Launch Agent" },
  ];
  const pct = Math.round((step / steps.length) * 100);
  const current = steps[step - 1]?.title ?? "";

  return (
    <div className="mx-auto w-full max-w-5xl p-6 pb-24 space-y-6">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur pt-6 pb-4 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Visa Application</h1>
            <p className="text-sm text-muted-foreground">Step-by-step wizard</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Save & Exit
          </Button>
        </div>
        <Separator className="mt-4" />
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <Progress value={pct} />
            </div>
            <div className="ml-4 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Step {step} of {steps.length}: {current}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {step === 1 ? (
          <TripSetup form={tripForm} />
        ) : step === 2 ? (
          <Checklist />
        ) : step === 3 ? (
          <UploadAndFill />
        ) : (
          <LaunchAgent />
        )}
      </div>

      <StickyFooter
        canPrev={step > 1}
        canNext={step < 4}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
        onNext={handleNext}
        onLaunch={() => setStep(4)}
        disabledReason={requirements[0]}
        showLaunch={step === 4}
        step={step}
        totalSteps={4}
      />
    </div>
  );
}