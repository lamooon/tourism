"use client";

import * as React from "react";
import { useApp } from "@/context/app-context";
import { CountryCombobox } from "@/components/ui/country-combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { visaAreaForDestination } from "@/lib/countries";
import type { UseFormReturn } from "react-hook-form";
import type { TripFormValues } from "./trip-form";

export function TripSetup({ form }: { form: UseFormReturn<TripFormValues> }) {
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
                {(() => {
                  const fromErr = form.formState.errors.from?.message as
                    | string
                    | undefined;
                  const toErr = form.formState.errors.to?.message as
                    | string
                    | undefined;
                  let msg = "";
                  if (fromErr && toErr) msg = "Select start and end date";
                  else if (fromErr) msg = "Select start date";
                  else if (toErr) msg = "Select end date";
                  return msg ? (
                    <p className="text-destructive text-sm">{msg}</p>
                  ) : null;
                })()}
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
