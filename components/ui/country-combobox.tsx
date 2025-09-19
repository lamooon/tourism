"use client";

import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Country } from "@/lib/countries";
import { getCountries } from "@/lib/countries";

type CountryComboboxProps = {
  label?: string;
  placeholder?: string;
  value: string | null; // alpha2 or alpha3 depending on usage
  valueKind?: "alpha2" | "alpha3";
  onChange: (nextCode: string) => void;
};

export function CountryCombobox({
  label,
  placeholder = "Select country",
  value,
  valueKind = "alpha3",
  onChange,
}: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCountries()
      .then((list) => {
        if (mounted) setCountries(list);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const selected = React.useMemo(() => {
    if (!value) return null;
    return (
      countries.find(
        (c) => (valueKind === "alpha3" ? c.alpha3 : c.alpha2) === value
      ) || null
    );
  }, [countries, value, valueKind]);

  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <img
                  src={selected.flagSvg}
                  alt={selected.name}
                  className="h-4 w-6 rounded-sm object-cover"
                  loading="lazy"
                />
                <span className="truncate">
                  {selected.name} (
                  {valueKind === "alpha3" ? selected.alpha3 : selected.alpha2})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                {loading ? "Loading…" : placeholder}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {countries.map((c) => {
                const code = valueKind === "alpha3" ? c.alpha3 : c.alpha2;
                const isSelected = value === code;
                return (
                  <CommandItem
                    key={code}
                    value={`${c.name} ${c.alpha3} ${c.alpha2}`}
                    onSelect={() => {
                      onChange(code);
                      setOpen(false);
                    }}
                  >
                    <img
                      src={c.flagSvg}
                      alt={c.name}
                      className="h-4 w-6 rounded-sm object-cover mr-2"
                      loading="lazy"
                    />
                    <span className="truncate">
                      {c.name} ({c.alpha3})
                    </span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
