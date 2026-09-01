import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, Switch, FormControlLabel, IconButton } from "@mui/material";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Plus, Trash2 } from "lucide-react";
import VirtualizedSocietySelect from "@/components/reusable/VirtualizedSocietySelect";

const fieldStyles = {
    height: '45px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
        height: '45px',
        '& fieldset': {
            borderColor: '#ddd',
        },
        '&:hover fieldset': {
            borderColor: '#C72030',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
};

const modules = [
    "OSR",
    "CMS",
    "FNB",
    "MARKETING",
    "HELPDESK",
    "AGENT",
    "NOTICEBOARD",
    "EVENT",
    "POLL",
    "VISITOR",
    "QUICK_CALL",
    "PMS",
    "ACCOUNT",
    "SMARTSECURE",
    "INVOICE",
    "CONSTRUCTIONUPDATE",
    "FITOUTS",
    "ABOUTUS",
    "OTHERPROJECT",
    "ABOUTCOMPLEX",
    "CONCIERGE",
    "RESIDENTMANUAL",
    "METERRECHARGE",
    "COMMITTEE",
    "DIRECTORY",
    "QuarantineTracker",
    "OFFERS"
];

interface Society {
    id: number;
    building_name: string;
}

const LockFeesAdd = () => {
    const navigate = useNavigate();
    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(false);
    const [societies, setSocieties] = useState<Society[]>([]);
    const [loadingSocieties, setLoadingSocieties] = useState(false);
    const [formData, setFormData] = useState({
        fee_for: "society",
        fee_for_id: localStorage.getItem("selectedSocietyId") || "",
        cca_sub_account: "",
        maxx: "",
        start_date: null,
        end_date: null,
        fee_type: "fixed",
        rate: "",
        active: true,
    });
    // Repeatable Module + Display Name rows — "+ Add Module" appends a new row.
    const [moduleRows, setModuleRows] = useState<{ module: string; displayName: string }[]>([
        { module: "", displayName: "" },
    ]);

    useEffect(() => {
        const fetchSocieties = async () => {
            try {
                setLoadingSocieties(true);
                const response = await axios.get(
                    `https://${baseUrl}/api/societies/search.json`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setSocieties(response.data?.societies || []);
            } catch (error) {
                console.error("Error fetching societies:", error);
                toast.error("Failed to fetch societies");
            } finally {
                setLoadingSocieties(false);
            }
        };
        fetchSocieties();
    }, [baseUrl, token]);



    const feeTypes = [
        "fixed",
        "percentage",
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddModuleRow = () => {
        setModuleRows((prev) => [...prev, { module: "", displayName: "" }]);
    };

    const handleRemoveModuleRow = (index: number) => {
        setModuleRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleModuleRowChange = (index: number, field: "module" | "displayName", value: string) => {
        setModuleRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    // Modules already picked in another row, per row — so each dropdown hides
    // choices already used elsewhere (except its own current value).
    const usedModulesExcluding = (index: number) =>
        new Set(moduleRows.filter((_, i) => i !== index).map((row) => row.module).filter(Boolean));

    const validateForm = () => {
        if (!formData.fee_for_id) {
            toast.error("Society is required");
            return false;
        }
        if (moduleRows.length === 0) {
            toast.error("Please add at least one module");
            return false;
        }
        const incompleteRow = moduleRows.find((row) => !row.module || !row.displayName.trim());
        if (incompleteRow) {
            toast.error("Please select a module and enter a display name for every row");
            return false;
        }
        const moduleValues = moduleRows.map((row) => row.module);
        const hasDuplicates = new Set(moduleValues).size !== moduleValues.length;
        if (hasDuplicates) {
            toast.error("Each module can only be added once");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const sharedFields = {
                fee_for: "society",
                fee_for_id: formData.fee_for_id,
                cca_sub_account: formData.cca_sub_account || null,
                maxx: formData.maxx.trim() ? parseInt(formData.maxx) : null,
                start_date: formData.start_date ? dayjs(formData.start_date).format("YYYY-MM-DD") : null,
                end_date: formData.end_date ? dayjs(formData.end_date).format("YYYY-MM-DD") : null,
                fee_type: formData.fee_type || null,
                rate: formData.rate.trim() ? parseInt(formData.rate) : null,
                active: formData.active,
            };

            const payload = {
                lock_fees: moduleRows.map((row) => ({
                    module: row.module,
                    display_name: row.displayName.trim(),
                    ...sharedFields,
                })),
            };

            await axios.post(
                `https://${baseUrl}/admin/lock_fees.json`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success(
                moduleRows.length > 1
                    ? `${moduleRows.length} Lock Fees created successfully!`
                    : "Lock Fee created successfully!"
            );
            navigate(-1);
        } catch (error: any) {
            console.error("Error creating lock fee:", error);
            const errorMessage = error.response?.data?.error || error.message || "Failed to create lock fee";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <button
                        onClick={handleCancel}
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span>Lock Fees List</span>
                    <span>{">"}</span>
                    <span className="text-gray-900 font-medium">Create New Lock Fee</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">ADD LOCK FEE</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Lock Fee Details Card */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 flex items-center">
                            <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: "#E5E0D3" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" fill="#C72030" />
                                </svg>
                            </span>
                            Lock Fee Details
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Society */}
                                <VirtualizedSocietySelect
                                    societies={societies}
                                    value={formData.fee_for_id}
                                    onChange={(value) => handleInputChange("fee_for_id", value)}
                                    loading={loadingSocieties}
                                    required
                                    sx={fieldStyles}
                                />

                                {/* Module + Display Name — repeatable rows, "+ Add Module" appends a new one */}
                                <div className="md:col-span-2 space-y-3">
                                    {moduleRows.map((row, index) => {
                                        const usedModules = usedModulesExcluding(index);
                                        return (
                                            <div key={index} className="flex flex-col sm:flex-row gap-3 sm:items-start">
                                                <FormControl fullWidth required>
                                                    <InputLabel shrink>Module</InputLabel>
                                                    <MuiSelect
                                                        value={row.module}
                                                        label="Module"
                                                        required
                                                        displayEmpty
                                                        onChange={(e) => handleModuleRowChange(index, "module", e.target.value)}
                                                        sx={fieldStyles}
                                                    >
                                                        <MenuItem value="" disabled>
                                                            <em>Select Module</em>
                                                        </MenuItem>
                                                        {modules.map((module) => (
                                                            <MenuItem
                                                                key={module}
                                                                value={module}
                                                                disabled={usedModules.has(module)}
                                                            >
                                                                {module}
                                                            </MenuItem>
                                                        ))}
                                                    </MuiSelect>
                                                </FormControl>

                                                <TextField
                                                    fullWidth
                                                    label="Display Name"
                                                    required
                                                    value={row.displayName}
                                                    onChange={(e) => handleModuleRowChange(index, "displayName", e.target.value)}
                                                    placeholder="Enter Display Name"
                                                    variant="outlined"
                                                    slotProps={{
                                                        inputLabel: {
                                                            shrink: true,
                                                        },
                                                    }}
                                                    InputProps={{
                                                        sx: fieldStyles,
                                                    }}
                                                />

                                                <IconButton
                                                    aria-label="Remove module"
                                                    onClick={() => handleRemoveModuleRow(index)}
                                                    disabled={moduleRows.length === 1}
                                                    sx={{ flexShrink: 0, height: "45px", width: "45px", alignSelf: { xs: "flex-end", sm: "auto" } }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-500" />
                                                </IconButton>
                                            </div>
                                        );
                                    })}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddModuleRow}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Module
                                    </Button>
                                </div>

                                {/* CCA Sub Account */}
                                <TextField
                                    fullWidth
                                    label="CCAVENUE ID"
                                    value={formData.cca_sub_account}
                                    onChange={(e) => handleInputChange("cca_sub_account", e.target.value)}
                                    placeholder="Enter CCAVENUE ID"
                                    variant="outlined"
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                    }}
                                    InputProps={{
                                        sx: fieldStyles,
                                    }}
                                />

                                {/* Maximum Amount */}
                                <TextField
                                    fullWidth
                                    label="Max Charge"
                                    type="number"
                                    value={formData.maxx}
                                    onChange={(e) => handleInputChange("maxx", e.target.value)}
                                    placeholder="Enter Max Charge"
                                    variant="outlined"
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                    }}
                                    InputProps={{
                                        sx: fieldStyles,
                                    }}
                                />

                                {/* Start Date */}
                                <DatePicker
                                    label="Subscription Start Date"
                                    value={formData.start_date}
                                    onChange={(date) => handleInputChange("start_date", date)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            InputProps: {
                                                sx: fieldStyles,
                                            },
                                        },
                                    }}
                                />

                                {/* End Date */}
                                <DatePicker
                                    label="Subscription End Date"
                                    value={formData.end_date}
                                    onChange={(date) => handleInputChange("end_date", date)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            InputProps: {
                                                sx: fieldStyles,
                                            },
                                        },
                                    }}
                                />

                                {/* Fee Type */}
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel shrink>Convinience Charge Type</InputLabel>
                                    <MuiSelect
                                        label="Fee Type"
                                        value={formData.fee_type}
                                        onChange={(e) => handleInputChange("fee_type", e.target.value)}
                                        sx={fieldStyles}
                                    >
                                        {feeTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>

                                {/* Rate */}
                                <TextField
                                    fullWidth
                                    label="Convinience Charge"
                                    type="number"
                                    value={formData.rate}
                                    onChange={(e) => handleInputChange("rate", e.target.value)}
                                    placeholder="Enter Rate"
                                    variant="outlined"
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                    }}
                                    InputProps={{
                                        sx: fieldStyles,
                                    }}
                                />

                                {/* Active Status */}
                                <div className="flex items-center">
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.active}
                                                onChange={(e) => handleInputChange("active", e.target.checked)}
                                                sx={{
                                                    "& .MuiSwitch-switchBase.Mui-checked": {
                                                        color: "#C72030",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(199, 32, 48, 0.04)",
                                                        },
                                                    },
                                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                                        backgroundColor: "#C72030",
                                                    },
                                                }}
                                            />
                                        }
                                        label="Active"
                                    />
                                </div>
                            </div>
                        </LocalizationProvider>
                    </div>
                </div>



                {/* Action Buttons */}
                <div className="flex gap-4 justify-center pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create Lock Fee"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default LockFeesAdd;