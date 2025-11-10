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
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(undefined);

  // Localized default values
  const defaultPlaceholder = placeholder || i18n._("Select option...");
  const defaultSearchPlaceholder = searchPlaceholder || i18n._("Search...");
  const defaultEmptyMessage = emptyMessage || i18n._("No option found.");

  // Measure trigger button width when popover opens
  React.useEffect(() => {
    if (open) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        // Find the trigger button element (the button inside PopoverTrigger)
        const triggerElement = document.querySelector('[role="combobox"][aria-expanded="true"]') as HTMLElement;
        if (triggerElement) {
          const width = triggerElement.offsetWidth;
          setPopoverWidth(width);
        }
      });
    }
  }, [open]);

  // Reset search query when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // Filter and limit items based on search query
  const filteredOptions = React.useMemo(() => {
    // Handle empty options
    if (!options || options.length === 0) {
      console.log("No options available");
      return [];
    }

    let filtered = options;
    const hasSearchQuery = searchQuery.trim().length > 0;
    console.log("Filtering options:", {
      totalOptions: options.length,
      searchQuery,
      hasSearchQuery,
    });

    // Filter by search query (case-insensitive, supports Cyrillic/Bulgarian)
    if (hasSearchQuery) {
      // Normalize search query for better Cyrillic support
      const queryLower = searchQuery.toLowerCase().normalize("NFC");
      console.log("Search query details:", {
        original: searchQuery,
        normalized: queryLower,
        length: searchQuery.length,
      });
      
      filtered = options.filter((option) => {
        if (!option || !option.label) return false;
        
        // Normalize and search in label (supports Bulgarian/Cyrillic)
        const labelNormalized = String(option.label).toLowerCase().normalize("NFC");
        const labelMatch = labelNormalized.includes(queryLower);
        
        // Search in dangerTypes if available (supports Bulgarian/Cyrillic)
        const dangerTypesMatch = option.dangerTypes && Array.isArray(option.dangerTypes)
          ? option.dangerTypes.some((dt: string) => {
              const dtNormalized = String(dt).toLowerCase().normalize("NFC");
              return dtNormalized.includes(queryLower);
            })
          : false;
        
        // Search in any other string fields (supports Bulgarian/Cyrillic)
        const otherFieldsMatch = Object.entries(option)
          .filter(([key]) => key !== 'value' && key !== 'label' && key !== 'dangerTypes')
          .some(([, val]) => {
            if (typeof val === 'string') {
              const valNormalized = val.toLowerCase().normalize("NFC");
              return valNormalized.includes(queryLower);
            }
            return false;
          });
        
        const matches = labelMatch || dangerTypesMatch || otherFieldsMatch;
        
        // Log first few options to debug
        if (options.indexOf(option) < 3) {
          console.log("Checking option:", {
            label: option.label,
            labelNormalized,
            queryLower,
            labelMatch,
            matches,
          });
        }
        
        return matches;
      });
      
      console.log("After filtering:", {
        originalCount: options.length,
        filteredCount: filtered.length,
        query: queryLower,
      });
    }

    // Limit items: 50 by default, 200 when searching
    const limit = hasSearchQuery ? 200 : 50;
    const result = filtered.slice(0, limit);
    console.log("Filtered results:", {
      filteredCount: filtered.length,
      resultCount: result.length,
      limit,
    });
    return result;
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
            onValueChange={(value) => {
              const newValue = value || "";
              console.log("Search query changed (from CommandInput):", newValue);
              setSearchQuery(newValue);
            }}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>{defaultEmptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option, index) => {
                // Create searchable value that includes label and any additional searchable fields
                const searchableValue = [
                  option.label,
                  option.dangerTypes && Array.isArray(option.dangerTypes)
                    ? option.dangerTypes.join(" ")
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                // Use a unique key: combine value with index to handle duplicates
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
