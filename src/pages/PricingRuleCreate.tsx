import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthenticatedFetchOptions } from "@/config/apiConfig";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { ArrowLeft } from "lucide-react";

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
      borderColor: "#1A1A18",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1A1A18",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "14px",
    "&.Mui-focused": {
      color: "#1A1A18",
    },
  },
  "& .MuiFormLabel-asterisk": {
    color: "#1A1A18",
  },
  "& .MuiInputBase-input": {
    fontSize: "14px",
    fontFamily: "Work Sans, sans-serif",
  },
};

interface PricingRuleForm {
  organization_id: string;
  generic_category_id: string;
  margin_type: string;
  margin_value: string;
  platform_fee_type: string;
  platform_fee_value: string;
}

const PricingRuleCreate: React.FC = () => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [formData, setFormData] = useState<PricingRuleForm>({
    organization_id: "",
    generic_category_id: "",
    margin_type: "percentage",
    margin_value: "",
    platform_fee_type: "percentage",
    platform_fee_value: "",
  });

  useEffect(() => {
    // Fetch organizations
    setLoadingOrgs(true);
    fetch(`https://${baseUrl}/organizations.json?token=${token}`)
      .then((res) => res.json())
      .then((data) => setOrganizations(data.organizations || []))
      .catch(() => setOrganizations([]))
      .finally(() => setLoadingOrgs(false));

    // Fetch categories
    setLoadingCats(true);
    fetch(`https://${baseUrl}/generic_categories?token=${token}`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.organization_id || formData.organization_id === "") {
      toast.error("Please select an organization");
      return false;
    }
    if (!formData.generic_category_id || formData.generic_category_id === "") {
      toast.error("Please select a category");
      return false;
    }
    if (!formData.margin_value.trim()) {
      toast.error("Please enter margin value");
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
      const url = `https://${baseUrl}/pricing_rules.json?rule_for=customer&token=${token}`;
      const payload = {
        pricing_rule: {
          organization_id: parseInt(formData.organization_id),
          generic_category_id: parseInt(formData.generic_category_id),
          margin_type: formData.margin_type,
          margin_value: parseFloat(formData.margin_value),
          platform_fee_type: formData.platform_fee_type,
          platform_fee_value: formData.platform_fee_value ? parseFloat(formData.platform_fee_value) : null,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create pricing rule");
      }

      toast.success("Pricing rule created successfully!");
      setTimeout(() => {
        navigate("/settings/pricing-rule-list");
      }, 1000);
    } catch (error) {
      toast.error("Failed to create pricing rule", {
        description: String(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/settings/pricing-rule-list");
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
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Pricing Rule</h1>
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
              Pricing Rule
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
                value={formData.organization_id}
                label="Organization"
                onChange={(e) => handleInputChange("organization_id", e.target.value)}
              >
                {loadingOrgs ? (
                  <MenuItem value="">Loading...</MenuItem>
                ) : organizations.length === 0 ? (
                  <MenuItem value="">No organizations found</MenuItem>
                ) : (
                  organizations.map((org: any) => (
                    <MenuItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={fieldStyles} required>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={formData.generic_category_id}
                label="Category"
                onChange={(e) => handleInputChange("generic_category_id", e.target.value)}
              >
                {loadingCats ? (
                  <MenuItem value="">Loading...</MenuItem>
                ) : categories.length === 0 ? (
                  <MenuItem value="">No categories found</MenuItem>
                ) : (
                  categories.map((cat: any) => (
                    <MenuItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={fieldStyles}>
              <InputLabel id="margin-type-label">Margin Type</InputLabel>
              <Select
                labelId="margin-type-label"
                value={formData.margin_type}
                label="Margin Type"
                onChange={(e) => handleInputChange("margin_type", e.target.value)}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="flat">Flat</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Margin Value"
              required
              type="number"
              value={formData.margin_value}
              onChange={(e) => handleInputChange("margin_value", e.target.value)}
              placeholder="e.g., 10"
              sx={fieldStyles}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: formData.margin_type === "percentage" ? (
                  <InputAdornment position="end">%</InputAdornment>
                ) : undefined,
              }}
            />

            <FormControl fullWidth sx={fieldStyles}>
              <InputLabel id="platform-fee-type-label">Platform Fee Type</InputLabel>
              <Select
                labelId="platform-fee-type-label"
                value={formData.platform_fee_type}
                label="Platform Fee Type"
                onChange={(e) => handleInputChange("platform_fee_type", e.target.value)}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="flat">Flat</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Platform Fee Value"
              type="number"
              value={formData.platform_fee_value}
              onChange={(e) => handleInputChange("platform_fee_value", e.target.value)}
              placeholder="e.g., 5"
              sx={fieldStyles}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: formData.platform_fee_type === "percentage" ? (
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
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </Box>
    </Box>
  );
};

export default PricingRuleCreate;
