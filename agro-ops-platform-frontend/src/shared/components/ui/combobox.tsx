"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useLingui } from "@lingui/react";

import { cn } from "@/src/shared/lib/utils";
import { Button } from "@/src/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/shared/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  [key: string]: unknown;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  className,
  renderOption,
}: ComboboxProps) {
  const { i18n } = useLingui();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>();

  // Localized default values
  const defaultPlaceholder = placeholder || i18n._("Select option...");
  const defaultSearchPlaceholder = searchPlaceholder || i18n._("Search...");
  const defaultEmptyMessage = emptyMessage || i18n._("No option found.");

  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      return;
    }

    requestAnimationFrame(() => {
      const triggerElement = document.querySelector(
        '[role="combobox"][aria-expanded="true"]',
      ) as HTMLElement | null;

      if (triggerElement) {
        setPopoverWidth(triggerElement.offsetWidth);
      }
    });
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    if (!options?.length) {
      return [];
    }

    const hasSearchQuery = searchQuery.trim().length > 0;
    if (!hasSearchQuery) {
      return options.slice(0, 50);
    }

    const queryLower = searchQuery.toLowerCase().normalize("NFC");
    const filtered = options.filter((option) => {
      if (!option?.label) {
        return false;
      }

      const labelNormalized = String(option.label)
        .toLowerCase()
        .normalize("NFC");
      const labelMatch = labelNormalized.includes(queryLower);

      const dangerTypesMatch =
        option.dangerTypes && Array.isArray(option.dangerTypes)
          ? option.dangerTypes.some((dt: string) =>
              String(dt).toLowerCase().normalize("NFC").includes(queryLower),
            )
          : false;

      const otherFieldsMatch = Object.entries(option)
        .filter(
          ([key]) => key !== "value" && key !== "label" && key !== "dangerTypes",
        )
        .some(([, val]) => {
          if (typeof val !== "string") {
            return false;
          }
          return val.toLowerCase().normalize("NFC").includes(queryLower);
        });

      return labelMatch || dangerTypesMatch || otherFieldsMatch;
    });

    return filtered.slice(0, 200);
  }, [options, searchQuery]);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption
            ? renderOption
              ? renderOption(selectedOption)
              : selectedOption.label
            : defaultPlaceholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={popoverWidth ? { width: `${popoverWidth}px` } : undefined}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={defaultSearchPlaceholder}
            value={searchQuery}
            onValueChange={(value) => setSearchQuery(value || "")}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>{defaultEmptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option, index) => {
                  const searchableValue = [
                    option.label,
                    option.dangerTypes && Array.isArray(option.dangerTypes)
                      ? option.dangerTypes.join(" ")
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const uniqueKey = `${option.value}-${index}`;

                  return (
                    <CommandItem
                      key={uniqueKey}
                      value={searchableValue}
                      onSelect={() => {
                        onValueChange?.(
                          option.value === value ? "" : option.value,
                        );
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {renderOption ? renderOption(option) : option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
