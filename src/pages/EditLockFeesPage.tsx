import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, Switch, FormControlLabel } from "@mui/material";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

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

// Skeleton Component for loading state
const SkeletonField = () => (
    <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
    </div>
);

const EditLockFeesPageSkeleton = () => (
    <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header Skeleton */}
        <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonField key={i} />
                ))}
            </div>
        </div>
    </div>
);

interface LockFeeData {
    id?: number;
    module: string;
    display_name: string;
    fee_for: string;
    fee_for_id: string;
    cca_sub_account: string;
    maxx: string | number;
    start_date: string | null;
    end_date: string | null;
    fee_type: string;
    rate: string | number;
    active: boolean;
}

const EditLockFeesPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<LockFeeData>({
        module: "OSR",
        display_name: "",
        fee_for: "society",
        fee_for_id: "",
        cca_sub_account: "",
        maxx: "",
        start_date: null,
        end_date: null,
        fee_type: "fixed",
        rate: "",
        active: true,
    });

    const feeTypes = ["fixed", "percentage"];

    // Fetch lock fee details
    useEffect(() => {
        const fetchLockFeeDetail = async () => {
            if (!id) {
                toast.error("Lock Fee ID is missing");
                navigate("/ops-console/admin/lock-fees");
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(
                    `https://${baseUrl}/admin/lock_fees/${id}.json`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = response.data.lock_fee || response.data;
                setFormData({
                    id: data.id,
                    module: data.module || "OSR",
                    display_name: data.display_name || "",
                    fee_for: data.fee_for || "society",
                    fee_for_id: data.fee_for_id || "",
                    cca_sub_account: data.cca_sub_account || "",
                    maxx: data.maxx || "",
                    start_date: data.start_date ? dayjs(data.start_date).format("YYYY-MM-DD") : null,
                    end_date: data.end_date ? dayjs(data.end_date).format("YYYY-MM-DD") : null,
                    fee_type: data.fee_type || "fixed",
                    rate: data.rate || "",
                    active: data.active !== undefined ? data.active : true,
                });
            } catch (error: any) {
                console.error("Error fetching lock fee detail:", error);
                const errorMessage = error.response?.data?.error || "Failed to fetch lock fee details";
                toast.error(errorMessage);
                navigate("/ops-console/admin/lock-fees");
            } finally {
                setLoading(false);
            }
        };

        fetchLockFeeDetail();
    }, [id, baseUrl, token, navigate]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateForm = () => {
        if (!formData.display_name.trim()) {
            toast.error("Display Name is required");
            return false;
        }
        if (!formData.cca_sub_account.trim()) {
            toast.error("CCA Sub Account is required");
            return false;
        }
        if (!formData.maxx) {
            toast.error("Maximum Amount is required");
            return false;
        }
        if (!formData.start_date) {
            toast.error("Start Date is required");
            return false;
        }
        if (!formData.end_date) {
            toast.error("End Date is required");
            return false;
        }
        if (!formData.fee_type) {
            toast.error("Fee Type is required");
            return false;
        }
        if (!formData.rate) {
            toast.error("Rate is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                lock_fee: {
                    module: formData.module,
                    display_name: formData.display_name,
                    fee_for: "society",
                    fee_for_id: localStorage.getItem("selectedSocietyId"),
                    cca_sub_account: formData.cca_sub_account,
                    maxx: parseInt(String(formData.maxx)),
                    start_date: dayjs(formData.start_date).format("YYYY-MM-DD"),
                    end_date: dayjs(formData.end_date).format("YYYY-MM-DD"),
                    fee_type: formData.fee_type,
                    rate: parseInt(String(formData.rate)),
                    active: formData.active,
                },
                id
            };

            await axios.put(
                `https://${baseUrl}/admin/lock_fees/${id}.json`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Lock Fee updated successfully!");
            navigate(`/ops-console/admin/lock-fees/${id}`);
        } catch (error: any) {
            console.error("Error updating lock fee:", error);

            const errors = error.response?.data;

            let errorMessage = "Failed to update lock fee";

            if (errors && typeof errors === "object") {
                errorMessage = Object.entries(errors)
                    .map(([field, messages]) => {
                        return `${field}: ${(messages as string[]).join(", ")}`;
                    })
                    .join(" | ");
            }

            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    if (loading) {
        return <EditLockFeesPageSkeleton />;
    }

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
                    <span className="text-gray-900 font-medium">Edit Lock Fee</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">EDIT LOCK FEE</h1>
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
                                {/* Module */}
                                <FormControl fullWidth>
                                    <InputLabel shrink>Module</InputLabel>
                                    <MuiSelect
                                        value={formData.module}
                                        label="Module"
                                        onChange={(e) => handleInputChange("module", e.target.value)}
                                        displayEmpty
                                        sx={fieldStyles}
                                    >
                                        {modules.map((module) => (
                                            <MenuItem key={module} value={module}>
                                                {module}
                                            </MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>

                                {/* Display Name */}
                                <TextField
                                    fullWidth
                                    label="Display Name"
                                    required
                                    value={formData.display_name}
                                    onChange={(e) => handleInputChange("display_name", e.target.value)}
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

                                {/* CCA Sub Account */}
                                <TextField
                                    fullWidth
                                    label="CCAVENUE ID"
                                    required
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
                                    required
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
                                    value={formData.start_date ? dayjs(formData.start_date) : null}
                                    onChange={(date) => handleInputChange("start_date", date)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
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
                                    value={formData.end_date ? dayjs(formData.end_date) : null}
                                    onChange={(date) => handleInputChange("end_date", date)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
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
                                    required
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
                        disabled={submitting}
                        className="!text-white px-8 py-2"
                    >
                        {submitting ? "Updating..." : "Update Lock Fee"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditLockFeesPage;
