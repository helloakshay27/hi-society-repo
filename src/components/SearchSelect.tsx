import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
    const [search, setSearch] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selected = options.find((opt) => opt.value === value)

    const filtered = options.filter((opt) =>
        opt.label?.toLowerCase().includes(search.toLowerCase())
    )

    // Close on outside click
    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setOpen((prev) => !prev)
                        setSearch("")
                    }
                }}
                className="flex w-full items-center justify-between rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-[#1a1a1a] shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className="truncate">
                    {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    {/* Search input */}
                    <div className="border-b border-gray-200 px-3 py-2">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Options list */}
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400">{emptyText}</li>
                        ) : (
                            filtered.map((opt) => (
                                <li
                                    key={opt.value}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        onChange(opt.value)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                    className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-100"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            value === opt.value ? "opacity-100 text-[#C72030]" : "opacity-0"
                                        )}
                                    />
                                    {opt.label}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}
