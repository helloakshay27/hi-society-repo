import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Option = {
    label: string
    value: string
}

type SearchableSelectProps = {
    options: Option[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    disabled?: boolean
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    className,
    disabled,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const selected = options.find((opt) => opt.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="outline"
                    role="combobox"
                    disabled={disabled}
                    aria-expanded={open}
                    className={cn("w-full justify-between !border-gray-300 !text-[#1a1a1a]", className)}
                >
                    {selected ? selected.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                style={{
                    width: triggerRef.current?.offsetWidth,
                }}
                className="w-[--radix-popover-trigger-width] p-0"
            >
                <Command onWheel={(e) => e.stopPropagation()}>
                    {/* 🔍 Search */}
                    <CommandInput placeholder={searchPlaceholder} />

                    <CommandEmpty>{emptyText}</CommandEmpty>

                    <CommandGroup
                        className="max-h-64 overflow-auto"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.label} // important for search
                                onSelect={() => {
                                    onChange(option.value)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}