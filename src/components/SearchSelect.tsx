import * as React from "react"
import { ChevronsUpDown, Search } from "lucide-react"
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
    triggerClassName?: string
    disabled?: boolean
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    searchPlaceholder = "Type to search...",
    emptyText = "No results found.",
    className,
    triggerClassName,
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
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-md border bg-white px-3 text-base font-medium text-gray-900 shadow-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    open ? "border-[#C72030]" : "border-gray-300 hover:bg-gray-50",
                    triggerClassName
                )}
            >
                <span className="truncate">
                    {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    {/* Search input */}
                    <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
                        <Search className="h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full bg-transparent text-base outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Options list */}
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-2.5 text-sm text-gray-400">{emptyText}</li>
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
                                    className={cn(
                                        "cursor-pointer px-4 py-2.5 text-base",
                                        value === opt.value ? "bg-blue-50 text-gray-900" : "hover:bg-gray-100 text-gray-800"
                                    )}
                                >
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
