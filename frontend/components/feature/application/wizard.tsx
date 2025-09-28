"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
// Remove unused Button import
// import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

// Add proper type for router
type NextRouter = ReturnType<typeof useRouter>;

export function Wizard() {
  useUser({ or: "redirect" });
  const user = useUser();
  const { state, loadApplication, createApplication, clearCurrentApplication } = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const appId = sp.get("appId");
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // 🚨 navigation guard state
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false);
  const [nextUrl, setNextUrl] = React.useState<string | null>(null);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [wizardStarted, setWizardStarted] = React.useState(false);

  // --- trip form ---
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

  // --- check if application has unsaved changes ---
  const hasUnsavedChanges = React.useMemo(() => {
    // Don't show dialog if we're in the process of navigating
    if (isNavigating) return false;

    // If wizard was started (user landed on the page), always show warning
    if (wizardStarted) return true;

    // Check if form is dirty
    const formIsDirty = tripForm.formState.isDirty;

    // Check if there's any progress in the application
    const hasProgress = state.checklist.some(item => state.checklistState[item.id]) ||
      state.uploads.length > 0 ||
      step > 1;

    return formIsDirty || hasProgress;
  }, [tripForm.formState.isDirty, state.checklistState, state.uploads.length, step, state.checklist, isNavigating, wizardStarted]);

  // --- initial app load ---
  React.useEffect(() => {
    const isNew = sp.get("new") === "1";
    if (isNew) {
      const id = createApplication();
      router.replace(`/app?appId=${id}`);
      setWizardStarted(true);
      return;
    }
    if (appId) {
      loadApplication(appId);
      setWizardStarted(true);
      return;
    }
    if (!state.currentAppId) {
      const id = createApplication();
      router.replace(`/app?appId=${id}`);
      setWizardStarted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  // --- reset form if trip changes ---
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

  // --- requirements ---
  const requirements: string[] = [];
  const reqIds = state.checklist
    .filter((i) => i.category === "Required")
    .map((i) => i.id);
  const allRequiredDone = reqIds.every((id) => state.checklistState[id]);
  if (!allRequiredDone)
    requirements.push("Complete all Required checklist items");
  if (!state.uploads.length)
    requirements.push("Upload at least one identity document");

  // --- next step handler ---
  async function handleNext() {
    if (step === 1) {
      const ok = await tripForm.trigger(undefined, { shouldFocus: true });
      if (!ok) {
        toast.error("Please complete required fields.");
        return;
      }

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
              userId: user?.id,
            }),
          });

          if (!res.ok) throw new Error("Failed to create trip");
          const trip = await res.json();

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

  // --- cleanup function ---
  const cleanupApplicationData = React.useCallback(() => {
    console.log("Cleaning up application data...");

    // Reset form
    tripForm.reset();

    // Clear application state
    clearCurrentApplication();

    // Reset step to initial
    setStep(1);

    // Reset wizard started flag
    setWizardStarted(false);
  }, [tripForm, clearCurrentApplication]);

  // --- confirm leave handler ---
  function confirmLeave() {
    console.log("Confirming leave, navigating to:", nextUrl);
    setIsNavigating(true);
    setShowLeaveDialog(false);

    // Cleanup data first
    cleanupApplicationData();

    // Force a complete page reload to ensure clean state
    if (nextUrl) {
      // Use window.location for a hard navigation that clears all React state
      window.location.href = nextUrl;
    }

    // Reset state
    setNextUrl(null);
  }

  // --- cancel leave handler ---
  function cancelLeave() {
    setShowLeaveDialog(false);
    setNextUrl(null);
  }

  // --- steps ---
  const steps = [
    { id: 1, title: "Trip Setup" },
    { id: 2, title: "Checklist" },
    { id: 3, title: "Upload & Fill" },
    { id: 4, title: "Launch Agent" },
  ];
  const pct = Math.round((step / steps.length) * 100);
  const current = steps[step - 1]?.title ?? "";

  // --- navigation guard ---
  React.useEffect(() => {
    // case 1: intercept all link clicks (including Next.js Link components)
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges || isNavigating) return;

      const target = (e.target as HTMLElement)?.closest("a");
      if (target && target instanceof HTMLAnchorElement) {
        const href = target.getAttribute("href");
        console.log("Link clicked:", href, "hasUnsavedChanges:", hasUnsavedChanges);

        // Check for any navigation away from the current wizard
        if (href && (
          href === "/" ||
          href.includes("/dashboard") ||
          href.startsWith("http") ||
          (href.startsWith("/") && !href.includes("/app"))
        )) {
          e.preventDefault();
          e.stopPropagation();
          setNextUrl(href);
          setShowLeaveDialog(true);
        }
      }
    };

    // case 2: browser back/forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges && !isNavigating) {
        e.preventDefault();
        setShowLeaveDialog(true);
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener("popstate", handlePopState);
      // Use capture phase to intercept before Next.js router
      document.addEventListener("click", handleClick, true);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick, true);
    };
  }, [hasUnsavedChanges, isNavigating]);

  // --- intercept Next.js router navigation ---
  React.useEffect(() => {
    if (!hasUnsavedChanges || isNavigating) return;

    const originalPush = router.push;
    const originalReplace = router.replace;

    // Create properly typed versions
    const interceptedPush = function(href: string, options?: Record<string, unknown>) {
      console.log("Router.push intercepted:", href);
      if (href === "/" || href.includes("/dashboard") || (!href.includes("/app") && href.startsWith("/"))) {
        setNextUrl(href);
        setShowLeaveDialog(true);
        return Promise.resolve(false);
      }
      return originalPush.call(router, href, options);
    };

    const interceptedReplace = function(href: string, options?: Record<string, unknown>) {
      console.log("Router.replace intercepted:", href);
      if (href === "/" || href.includes("/dashboard") || (!href.includes("/app") && href.startsWith("/"))) {
        setNextUrl(href);
        setShowLeaveDialog(true);
        return Promise.resolve(false);
      }
      return originalReplace.call(router, href, options);
    };

    // Override the router methods
    (router as NextRouter & { push: typeof interceptedPush }).push = interceptedPush;
    (router as NextRouter & { replace: typeof interceptedReplace }).replace = interceptedReplace;

    return () => {
      (router as NextRouter).push = originalPush;
      (router as NextRouter).replace = originalReplace;
    };
  }, [hasUnsavedChanges, router, isNavigating]);

  return (
    <>
      <div className="mx-auto w-full max-w-5xl p-6 pb-24 space-y-6">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur pt-6 pb-4 -mx-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Visa Application</h1>
              <p className="text-sm text-muted-foreground">
                Step-by-step wizard
              </p>
            </div>
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
          onPrev={() =>
            setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))
          }
          onNext={handleNext}
          onLaunch={() => setStep(4)}
          disabledReason={requirements[0]}
          showLaunch={step === 4}
          step={step}
          totalSteps={4}
        />
      </div>

      {/* Enhanced AlertDialog for navigation guard */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Leave Application?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You have unsaved changes in your visa application. If you leave now, all your progress including form data, uploaded documents, and checklist items will be lost and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>
              Stay and Continue
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave and Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}