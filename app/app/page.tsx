"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

function StickyFooter({
  canPrev,
  canNext,
  onPrev,
  onNext,
  onLaunch,
  disabledReason,
}: {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLaunch: () => void;
  disabledReason?: string;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur p-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Use Prev/Next to navigate. Progress updates automatically.
      </div>
      <div className="space-x-2">
        <Button variant="outline" disabled={!canPrev} onClick={onPrev}>
          Prev
        </Button>
        <Button variant="outline" disabled={!canNext} onClick={onNext}>
          Next
        </Button>
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
      </div>
    </div>
  );
}

function TripSetup() {
  const { state, updateTrip } = useApp();
  const trip = state.trip;
  const [open, setOpen] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);

  function setDestination(v: "US" | "Schengen" | "UK") {
    setIsCalculating(true);
    updateTrip({ destination: v });
    setTimeout(() => setIsCalculating(false), 600);
  }

  function setPurpose(v: "Tourist" | "Business") {
    updateTrip({ purpose: v });
  }

  const valid = Boolean(
    trip?.nationality &&
      trip?.destination &&
      trip?.purpose &&
      trip?.dates.from &&
      trip?.dates.to
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nationality</label>
          <Input
            value={trip?.nationality ?? ""}
            onChange={(e) => updateTrip({ nationality: e.target.value })}
            aria-describedby="nat-help"
          />
          <p id="nat-help" className="text-xs text-muted-foreground">
            Defaulted to Hong Kong SAR.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Destination</label>
          <Select
            value={trip?.destination ?? undefined}
            onValueChange={(v) => setDestination(v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="Schengen">Schengen</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Purpose</label>
          <Select
            value={trip?.purpose ?? undefined}
            onValueChange={(v) => setPurpose(v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tourist">Tourist</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Travel Dates</label>
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
                  to: trip?.dates.to ? new Date(trip.dates.to) : undefined,
                }}
                onSelect={(r) =>
                  updateTrip({
                    dates: {
                      from: r?.from ? format(r.from, "yyyy-MM-dd") : null,
                      to: r?.to ? format(r.to, "yyyy-MM-dd") : null,
                    },
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            We use dates to compute due dates.
          </p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {isCalculating ? (
          <span className="animate-pulse">Calculating visa rules…</span>
        ) : trip?.visaTypeLabel ? (
          <span>
            Visa Type: <Badge variant="secondary">{trip.visaTypeLabel}</Badge>
          </span>
        ) : (
          <span>Select destination to see visa type.</span>
        )}
      </div>
      <div className="text-sm">Next is enabled when all fields are valid.</div>
    </div>
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
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
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
                  {String((state.extraction as any)[m.extractedKey])}
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
  const { state, loadApplication } = useApp();
  const sp = useSearchParams();
  const appId = sp.get("appId");
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  React.useEffect(() => {
    if (appId) loadApplication(appId);
  }, [appId]);

  const requirements: string[] = [];
  const reqIds = state.checklist
    .filter((i) => i.category === "Required")
    .map((i) => i.id);
  const allRequiredDone = reqIds.every((id) => state.checklistState[id]);
  if (!allRequiredDone)
    requirements.push("Complete all Required checklist items");
  if (!state.uploads.length)
    requirements.push("Upload at least one identity document");

  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Visa Application</h1>
        <p className="text-sm text-muted-foreground">Step-by-step wizard</p>
      </div>
      <Separator />

      <Accordion
        type="single"
        collapsible
        value={String(step)}
        onValueChange={(v) => setStep(Number(v) as any)}
      >
        <AccordionItem value="1">
          <AccordionTrigger>1. Trip Setup</AccordionTrigger>
          <AccordionContent>
            <TripSetup />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="2">
          <AccordionTrigger>2. Checklist</AccordionTrigger>
          <AccordionContent>
            <Checklist />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="3">
          <AccordionTrigger>3. Upload & Fill</AccordionTrigger>
          <AccordionContent>
            <UploadAndFill />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="4">
          <AccordionTrigger>4. Launch Agent</AccordionTrigger>
          <AccordionContent>
            <LaunchAgent />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <StickyFooter
        canPrev={step > 1}
        canNext={step < 4}
        onPrev={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
        onNext={() => setStep((s) => (s < 4 ? ((s + 1) as any) : s))}
        onLaunch={() => setStep(4)}
        disabledReason={requirements[0]}
      />
    </div>
  );
}

export default function WizardPage() {
  return <WizardInner />;
}
