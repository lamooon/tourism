"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { z } from "zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Upload,
  Rocket,
  Filter,
  CalendarIcon,
  ClipboardCopy,
} from "lucide-react";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { visaAreaForDestination } from "@/lib/countries";
import { Progress } from "@/components/ui/progress";

type TripFormValues = {
  nationalityCode: string;
  destinationCountryAlpha2: string;
  purpose: "Tourist" | "Business";
  from: string;
  to: string;
};

const TripFormSchema = z.object({
  nationalityCode: z.string().min(1, "Select nationality"),
  destinationCountryAlpha2: z.string().min(1, "Select destination"),
  purpose: z.enum(["Tourist", "Business"]),
  from: z.string().min(1, "Select start date"),
  to: z.string().min(1, "Select end date"),
});

function StickyFooter({
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
        <div className="space-x-2">
          {canPrev && (
            <Button variant="outline" onClick={onPrev}>
              Prev
            </Button>
          )}
          {!showLaunch && (
            <Button
              variant="default"
              size="lg"
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
                  onClick={onLaunch}
                  className="gap-2"
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

function TripSetup({ form }: { form: UseFormReturn<TripFormValues> }) {
  const { state, updateTrip } = useApp();
  const trip = state.trip;
  const [open, setOpen] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);

  function setPurpose(v: "Tourist" | "Business") {
    updateTrip({ purpose: v });
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nationalityCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <CountryCombobox
                  placeholder="Select nationality"
                  value={field.value || null}
                  valueKind="alpha3"
                  onChange={(alpha3) => {
                    field.onChange(alpha3);
                    updateTrip({ nationalityCode: alpha3 });
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destinationCountryAlpha2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination</FormLabel>
                <CountryCombobox
                  placeholder="Select destination country"
                  value={field.value || null}
                  valueKind="alpha2"
                  onChange={(alpha2) => {
                    field.onChange(alpha2);
                    setIsCalculating(true);
                    const area = visaAreaForDestination(alpha2);
                    updateTrip({
                      destinationCountryAlpha2: alpha2,
                      destination: area,
                    });
                    setTimeout(() => setIsCalculating(false), 600);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose of Travel</FormLabel>
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setPurpose(v as "Tourist" | "Business");
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Tourist">Tourist</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Travel Dates</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !trip?.dates.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {trip?.dates.from ? (
                        trip.dates.to ? (
                          `${trip.dates.from} → ${trip.dates.to}`
                        ) : (
                          trip.dates.from
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: trip?.dates.from
                          ? new Date(trip.dates.from)
                          : undefined,
                        to: trip?.dates.to
                          ? new Date(trip.dates.to)
                          : undefined,
                      }}
                      onSelect={(r) => {
                        const fromStr = r?.from
                          ? format(r.from, "yyyy-MM-dd")
                          : "";
                        const toStr = r?.to ? format(r.to, "yyyy-MM-dd") : "";
                        field.onChange(fromStr);
                        form.setValue("to", toStr, { shouldValidate: true });
                        updateTrip({
                          dates: { from: fromStr || null, to: toStr || null },
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
                {form.formState.errors.to ? (
                  <p className="text-destructive text-sm">
                    {String(form.formState.errors.to.message)}
                  </p>
                ) : null}
              </FormItem>
            )}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {isCalculating ? (
            <span className="animate-pulse">Calculating visa rules…</span>
          ) : trip?.visaTypeLabel ? (
            <span>
              Visa Type: <Badge variant="secondary">{trip.visaTypeLabel}</Badge>
            </span>
          ) : (
            <span>
              Select nationality and destination to see visa type and
              requirements.
            </span>
          )}
        </div>
        {trip?.visaTypeLabel && state.checklist.length > 0 ? (
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span>Requirements:</span>
            {state.checklist
              .filter((i) => i.category === "Required")
              .map((i) => (
                <Badge key={i.id}>{i.title}</Badge>
              ))}
          </div>
        ) : null}
        <div className="text-sm">Next validates required fields.</div>
      </div>
    </Form>
  );
}

function Checklist() {
  const { state, toggleChecklistItem } = useApp();
  const [filter, setFilter] = React.useState<
    "All" | "Required" | "Recommended" | "Done"
  >("All");
  const [sortBySoonest, setSortBySoonest] = React.useState(true);

  let items = state.checklist;
  if (filter === "Required")
    items = items.filter((i) => i.category === "Required");
  if (filter === "Recommended")
    items = items.filter((i) => i.category === "Recommended");
  if (filter === "Done")
    items = items.filter((i) => state.checklistState[i.id]);
  if (sortBySoonest)
    items = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const doneCount = state.checklist.filter(
    (i) => state.checklistState[i.id]
  ).length;
  const reqTotal = state.checklist.filter(
    (i) => i.category === "Required"
  ).length;
  const reqDone = state.checklist.filter(
    (i) => i.category === "Required" && state.checklistState[i.id]
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filter}
          onValueChange={(v) =>
            setFilter(v as "All" | "Required" | "Recommended" | "Done")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Required">Required</SelectItem>
            <SelectItem value="Recommended">Recommended</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setSortBySoonest((s) => !s)}
        >
          <Filter className="size-4" />{" "}
          {sortBySoonest ? "Soonest first" : "Original order"}
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {doneCount}/{state.checklist.length} complete · Required {reqDone}/
          {reqTotal}
        </div>
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-3 rounded-md border p-3"
          >
            <Checkbox
              checked={!!state.checklistState[i.id]}
              onCheckedChange={() => toggleChecklistItem(i.id)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{i.title}</div>
                <Badge
                  variant={i.category === "Required" ? "default" : "secondary"}
                >
                  {i.category}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  Due {i.dueDate}
                </span>
              </div>
              {i.description ? (
                <div className="text-sm text-muted-foreground">
                  {i.description}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadAndFill() {
  const { state, setUploads, updateMappingValue } = useApp();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted = ["application/pdf", "image/jpeg", "image/png"];
    const next: typeof state.uploads = [];
    for (const f of Array.from(files)) {
      const tooBig = f.size > 10 * 1024 * 1024;
      const wrongType = !accepted.includes(f.type);
      if (wrongType || tooBig) {
        toast.error(
          wrongType
            ? `Unsupported type: ${f.type}`
            : `File too large: ${Math.round(f.size / (1024 * 1024))} MB`
        );
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        filename: f.name,
        size: f.size,
        mimeType: f.type,
        status: "Uploaded",
      });
    }
    if (next.length) setUploads([...(state.uploads ?? []), ...next]);
  }

  function onCopyMapping() {
    const merged = state.mapping.map((m) => ({
      ...m,
      value: state.mappingOverrides[m.formField] ?? m.value,
    }));
    navigator.clipboard.writeText(
      JSON.stringify(
        { visaType: state.trip?.visaTypeLabel, mappings: merged },
        null,
        2
      )
    );
    toast.success("Mapping JSON copied");
  }

  function onSimulateFill() {
    toast.message("Simulating form fill…", { description: "Rows highlighted" });
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-md border border-dashed p-6 text-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        role="region"
        aria-label="File upload dropzone"
      >
        <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />
        <div className="font-medium">
          Drag and drop files, or click to upload
        </div>
        <div className="text-sm text-muted-foreground">
          PDF, JPG, PNG up to 10 MB
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {state.uploads.length > 0 && (
        <div className="space-y-2">
          {state.uploads.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {u.mimeType.split("/")[1].toUpperCase()}
                </Badge>
                <div>
                  <div className="font-medium">{u.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(u.size / 1024)} KB · {u.status}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setUploads(state.uploads.filter((x) => x.id !== u.id))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="font-medium mb-2">Extraction Preview</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3 space-y-1">
            <div>MRZ</div>
            <div className="font-mono text-xs whitespace-pre-wrap">
              {state.extraction.mrz}
            </div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Full Name</div>
            <div>{state.extraction.fullName}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Date of Birth</div>
            <div>{state.extraction.dateOfBirth}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Passport Number</div>
            <div>{state.extraction.passportNumber}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Nationality</div>
            <div>{state.extraction.nationality}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <div>Expiry</div>
            <div>{state.extraction.expiry}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1 md:col-span-2">
            <div>Address</div>
            <div>{state.extraction.address}</div>
          </div>
          <div className="rounded-md border p-3 space-y-1 md:col-span-2">
            <div>Bank Balance (HKD)</div>
            <div>{state.extraction.bankBalanceHKD.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="font-medium mb-2 flex items-center justify-between">
          <span>Mapping</span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyMapping}
              className="gap-2"
            >
              <ClipboardCopy className="size-4" /> Copy Mapping JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSimulateFill}
              className="gap-2"
            >
              Simulate Fill
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Extracted Field</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead>Mapped Value</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.mapping.map((m) => (
              <TableRow key={m.formField} className="transition-colors">
                <TableCell>{m.extractedKey}</TableCell>
                <TableCell>
                  {String(state.extraction[m.extractedKey])}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {m.formField}
                </TableCell>
                <TableCell>
                  <Input
                    value={String(
                      state.mappingOverrides[m.formField] ?? m.value
                    )}
                    onChange={(e) =>
                      updateMappingValue(m.formField, e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      m.confidence === "high"
                        ? "default"
                        : m.confidence === "medium"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {m.confidence}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LaunchAgent() {
  const { state } = useApp();
  const reqIds = state.checklist
    .filter((i) => i.category === "Required")
    .map((i) => i.id);
  const allRequiredDone = reqIds.every((id) => state.checklistState[id]);
  const hasPassport = state.uploads.some((u) =>
    /pdf|jpeg|png/.test(u.mimeType)
  );
  const noBlockingErrors = true;
  const ready = allRequiredDone && hasPassport && noBlockingErrors;
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-6 min-h-[420px] flex items-center justify-center text-muted-foreground">
        Agent Runner — placeholder
      </div>

      <Button className="gap-2" onClick={() => setOpen(true)} disabled={!ready}>
        <Rocket className="size-4" /> Launch Agent
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Running agent…</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div>Opening form…</div>
            <div>Filling section A…</div>
            <div>Reviewing…</div>
            <div className="font-medium text-green-600">Complete</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WizardInner() {
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
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-6 pb-24 space-y-6">
      <div className="sticky top-0 z-40 -mx-6 px-6 py-4 bg-background/80 backdrop-blur border-b">
        {(() => {
          const steps = [
            { id: 1, title: "Trip Setup" },
            { id: 2, title: "Checklist" },
            { id: 3, title: "Upload & Fill" },
            { id: 4, title: "Launch Agent" },
          ];
          const pct = Math.round((step / steps.length) * 100);
          const current = steps[step - 1]?.title ?? "";
          const isSaving = false; // UI-only; backend save pending implementation
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <Progress value={pct} />
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Unsaved changes
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    Save & Exit
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Step {step} of {steps.length}: {current}
              </div>
            </div>
          );
        })()}
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

export default function WizardPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <WizardInner />
    </React.Suspense>
  );
}
