"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  disabled = false,
  className,
  renderOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Limit to 50 items and filter by search query
  const filteredOptions = React.useMemo(() => {
    let filtered = options;

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      filtered = options.filter((option) =>
        option.label.toLowerCase().includes(queryLower),
      );
    }

    // Limit to 50 items
    return filtered.slice(0, 50);
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
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                // Create searchable value that includes label and any additional searchable fields
                const searchableValue = [
                  option.label,
                  option.dangerTypes && Array.isArray(option.dangerTypes)
                    ? option.dangerTypes.join(" ")
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <CommandItem
                    key={option.value}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
