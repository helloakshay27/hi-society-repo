import React, { useMemo, useRef, useState } from "react";
import {
    FormControl,
    InputLabel,
    Select as MuiSelect,
    MenuItem,
    TextField,
    SxProps,
    Theme,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface SocietyOption {
    id: number;
    building_name: string;
}

interface VirtualizedSocietySelectProps {
    societies: SocietyOption[];
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
    label?: string;
    required?: boolean;
    sx?: SxProps<Theme>;
}

const ROW_HEIGHT = 40;

// Society lists coming from the API can have ~3000 entries. Rendering every
// MenuItem at once makes the dropdown janky to open/scroll, so only the rows
// currently in (or near) the viewport are mounted via @tanstack/react-virtual.
// The dropdown's own Paper (not a nested div) is used as the virtualizer's
// scroll container so it keeps the same max-height/scroll behavior as every
// other Select in the app (see src/styles/enhanced-select.css) instead of
// creating a second, mismatched scroll region.
const VirtualizedSocietySelect: React.FC<VirtualizedSocietySelectProps> = ({
    societies,
    value,
    onChange,
    loading = false,
    label = "Society",
    required = false,
    sx,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const paperRef = useRef<HTMLDivElement | null>(null);

    const filteredSocieties = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return societies;
        return societies.filter((society) =>
            society.building_name?.toLowerCase().includes(term)
        );
    }, [societies, search]);

    const virtualizer = useVirtualizer({
        count: filteredSocieties.length,
        getScrollElement: () => paperRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 8,
    });

    const selectedSociety = useMemo(
        () => societies.find((society) => society.id.toString() === value),
        [societies, value]
    );

    const handleSelect = (societyId: string) => {
        onChange(societyId);
        setOpen(false);
        setSearch("");
    };

    return (
        <FormControl fullWidth required={required}>
            <InputLabel shrink>{label}</InputLabel>
            <MuiSelect
                value={value}
                label={label}
                required={required}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => {
                    setOpen(false);
                    setSearch("");
                }}
                displayEmpty
                disabled={loading}
                renderValue={() =>
                    selectedSociety
                        ? selectedSociety.building_name
                        : loading
                            ? "Loading..."
                            : "Select Society"
                }
                sx={sx}
                MenuProps={{
                    autoFocus: false,
                    // Prevents the app-wide MUI Select search enhancer (globalMUISelectSearchEnhancer)
                    // from injecting its own "Type to search..." box on top of this one
                    className: "disable-mui-select-search",
                    PaperProps: {
                        ref: paperRef,
                        className: "disable-mui-select-search",
                    },
                }}
            >
                {/* Keeps MUI's value-matching happy for the empty/placeholder state */}
                <MenuItem value="" style={{ display: "none" }} />

                <MenuItem
                    disableRipple
                    onKeyDown={(e) => e.stopPropagation()}
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                        },
                        cursor: "default",
                        padding: "12px",
                        borderBottom: "1px solid #dee2e6",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <TextField
                        autoFocus
                        fullWidth
                        placeholder="🔍 Type to search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        sx={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                backgroundColor: "#fff",
                                fontSize: "14px",
                                "& fieldset": {
                                    borderColor: "#e9ecef",
                                    borderWidth: "2px",
                                },
                                "&:hover fieldset": {
                                    borderColor: "#e9ecef",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#1976d2",
                                    borderWidth: "2px",
                                },
                            },
                            "& .MuiOutlinedInput-root.Mui-focused": {
                                boxShadow: "0 0 0 4px rgba(25, 118, 210, 0.15)",
                                backgroundColor: "#fafbfc",
                            },
                            "& .MuiOutlinedInput-input": {
                                padding: "12px 16px",
                            },
                            "& input::placeholder": {
                                color: "#6c757d",
                                fontWeight: 500,
                                opacity: 1,
                            },
                        }}
                    />
                </MenuItem>

                {filteredSocieties.length === 0 ? (
                    <MenuItem disabled>
                        <em>{loading ? "Loading..." : "No societies found"}</em>
                    </MenuItem>
                ) : (
                    <div
                        style={{
                            height: virtualizer.getTotalSize(),
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const society = filteredSocieties[virtualRow.index];
                            return (
                                <MenuItem
                                    key={society.id}
                                    selected={value === society.id.toString()}
                                    onClick={() => handleSelect(society.id.toString())}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: ROW_HEIGHT,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {society.building_name}
                                </MenuItem>
                            );
                        })}
                    </div>
                )}
            </MuiSelect>
        </FormControl>
    );
};

export default VirtualizedSocietySelect;
