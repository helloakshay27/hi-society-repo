import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { ArrowLeft } from "lucide-react";
import { log } from "console";

const SectionCard = styled(Paper)(() => ({
  backgroundColor: "white",
  boxShadow: "none",
  borderRadius: "16px",
  overflow: "hidden",
  marginBottom: "24px",
  border: "1px solid rgba(26,26,24,.09)",
}));

const SectionBody = styled(Box)(() => ({
  backgroundColor: "white",
  padding: "24px",
}));

const SectionHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  backgroundColor: "white",
  padding: "22px 24px 0",
}));

const IconWrapper = styled(Box)(() => ({
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#F5F4F0",
}));

const fieldStyles = {
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    fontSize: "14px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#D97757",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D97757",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "14px",
    "&.Mui-focused": {
      color: "#D97757",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "14px",
    fontFamily: "Work Sans, sans-serif",
  },
};

const disabledFieldStyles = {
  ...fieldStyles,
  "& .MuiOutlinedInput-root": {
    ...fieldStyles["& .MuiOutlinedInput-root"],
    backgroundColor: "#FDFDFB",
  },
};

interface PricingRule {
  id: number;
  organization_id: number;
  generic_category_id: number;
  margin_type: string;
  margin_value: number;
}

export const PricingRuleEdit: React.FC = () => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pricingRule, setPricingRule] = useState<PricingRule | null>(null);
  const [marginType, setMarginType] = useState<string>("percentage");
  const [marginValue, setMarginValue] = useState<string>("");
  const [platformFeeType, setPlatformFeeType] = useState<string>("percentage");
  const [platformFeeValue, setPlatformFeeValue] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);
  console.log("id", id)
  const fetchPricingRule = async () => {
    setLoading(true);
    try {
      const url = `https://${baseUrl}/pricing_rules/${id}?token=${token}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch pricing rule");
      }

      const data = await response.json();
      setPricingRule(data);
      setMarginType(data.margin_type || "percentage");
      setMarginValue(data.margin_value?.toString() || "");
      setPlatformFeeType(data.platform_fee_type || "percentage");
      setPlatformFeeValue(data.platform_fee_value?.toString() || "");
      setOrganizationId(data.organization_id ? data.organization_id.toString() : "");
      setCategoryId(data.generic_category_id ? data.generic_category_id.toString() : "");
    } catch (error) {
      toast.error("Failed to load pricing rule", {
        description: String(error),
      });
      navigate("/settings/pricing-rule-list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch organizations
    fetch(`https://${baseUrl}/organizations.json?token=${token}`)
      .then((res) => res.json())
      .then((data) => setOrganizations(data.organizations || []))
      .catch(() => setOrganizations([]));

    // Fetch categories
    fetch(`https://${baseUrl}/generic_categories?token=${token}`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));

    fetchPricingRule();
  }, [id]);



  const validateForm = (): boolean => {
    if (!marginValue.trim()) {
      toast.error("Please enter margin value");
      return false;
    }
    const value = parseFloat(marginValue);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid margin value");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const url = `https://${baseUrl}/pricing_rules/${id}?token=${token}`;
      const payload = {
        pricing_rule: {
          margin_type: marginType,
          margin_value: parseFloat(marginValue),
          platform_fee_type: platformFeeType,
          platform_fee_value: platformFeeValue ? parseFloat(platformFeeValue) : null,
        },
      };

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update pricing rule");
      }

      toast.success("Pricing rule updated successfully!");
      setTimeout(() => {
        navigate("/settings/pricing-rule-list");
      }, 1000);
    } catch (error) {
      toast.error("Failed to update pricing rule", {
        description: String(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/settings/pricing-rule-list");
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p>Loading pricing rule...</p>
        </div>
      </div>
    );
  }

  if (!pricingRule) {
    return null;
  }

  const getOrganizationName = () => {
    const org = organizations.find((o: any) => o.id === pricingRule.organization_id);
    return org ? (org as any).name : pricingRule.organization_id.toString();
  };

  const getCategoryName = () => {
    const cat = categories.find((c: any) => c.id === pricingRule.generic_category_id);
    return cat ? (cat as any).name : pricingRule.generic_category_id.toString();
  };

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: "#FDFDFB",
        minHeight: "100vh",
      }}
    >
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Pricing Rules</span>
          <span className="mx-2">{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pricing Rule</h1>
      </div>

      {/* Pricing Rule Form */}
      <SectionCard>
        <SectionHeader>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <IconWrapper>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1A18"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </IconWrapper>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: "14px", lineHeight: 1.4, color: "#1A1A18" }}
            >
              Edit Pricing Rule
            </Typography>
          </Box>
        </SectionHeader>
        <SectionBody>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            <FormControl fullWidth sx={fieldStyles} required>
              <InputLabel id="organization-label">Organization</InputLabel>
              <Select
                labelId="organization-label"
                value={organizationId}
                label="Organization"
                onChange={(e) => setOrganizationId(e.target.value)}
                disabled
              >
                {organizations.map((org: any) => (
                  <MenuItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={fieldStyles} required>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={categoryId}
                label="Category"
                onChange={(e) => setCategoryId(e.target.value)}
                disabled
              >
                {categories.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={fieldStyles} required>
              <InputLabel id="margin-type-label">Margin Type</InputLabel>
              <Select
                labelId="margin-type-label"
                value={marginType}
                label="Margin Type"
                onChange={(e) => setMarginType(e.target.value)}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="flat">Flat</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Margin Value"
              required
              type="number"
              value={marginValue}
              onChange={(e) => setMarginValue(e.target.value)}
              placeholder="e.g., 10"
              sx={fieldStyles}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: marginType === "percentage" ? (
                  <InputAdornment position="end">%</InputAdornment>
                ) : undefined,
              }}
            />

            <FormControl fullWidth sx={fieldStyles} required>
              <InputLabel id="platform-fee-type-label">Platform Fee Type</InputLabel>
              <Select
                labelId="platform-fee-type-label"
                value={platformFeeType}
                label="Platform Fee Type"
                onChange={(e) => setPlatformFeeType(e.target.value)}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="flat">Flat</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Platform Fee Value"
              type="number"
              value={platformFeeValue}
              onChange={(e) => setPlatformFeeValue(e.target.value)}
              placeholder="e.g., 5"
              sx={fieldStyles}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: platformFeeType === "percentage" ? (
                  <InputAdornment position="end">%</InputAdornment>
                ) : undefined,
              }}
            />
          </Box>
        </SectionBody>
      </SectionCard>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mb: 4 }}>
<button
          type="button"
          onClick={handleCancel} disabled={submitting}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
        >
          Cancel
        </button>
<button
          type="button"
          onClick={handleSubmit} disabled={submitting}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
        >
          {submitting ? "Updating..." : "Update"}
        </button>
      </Box>
    </Box>
  );
};

export default PricingRuleEdit;
