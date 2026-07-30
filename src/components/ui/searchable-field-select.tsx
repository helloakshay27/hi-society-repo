import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export interface SearchableFieldOption {
  value: string;
  label: React.ReactNode;
  searchText?: string;
}

interface SearchableFieldSelectProps {
  label: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SearchableFieldOption[];
  placeholder?: string;
  emptyOptionLabel?: string;
}

export const SearchableFieldSelect: React.FC<SearchableFieldSelectProps> = ({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  emptyOptionLabel,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#C72030]">
      <legend className="px-1 text-[#C72030] font-medium text-sm">
        {label} {required && <span className="text-red-600">*</span>}
      </legend>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between bg-transparent text-base italic text-black focus:outline-none"
          >
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-[#ddd] rounded-lg bg-white z-[99999]"
          align="start"
          sideOffset={8}
        >
          <Command className="w-full bg-white overflow-hidden">
            <CommandInput placeholder="Type to search..." className="h-10 text-sm" />
            <CommandList className="max-h-[240px] overflow-y-auto">
              <CommandEmpty className="py-3 text-center text-sm text-gray-500">No results found.</CommandEmpty>
              <CommandGroup>
                {emptyOptionLabel && (
                  <CommandItem
                    value="__empty__"
                    onSelect={() => { onChange(''); setOpen(false); }}
                    className="cursor-pointer text-gray-500"
                  >
                    {emptyOptionLabel}
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.searchText ?? String(option.label)}
                    onSelect={() => { onChange(option.value); setOpen(false); }}
                    className="cursor-pointer aria-selected:bg-blue-50"
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </fieldset>
  );
};
