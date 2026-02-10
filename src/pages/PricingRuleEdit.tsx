import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Button as MuiButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const SectionCard = styled(Paper)(() => ({
  backgroundColor: "white",
  boxShadow:
    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  borderRadius: "8px",
  overflow: "hidden",
  marginBottom: "24px",
  border: "1px solid #E5E5E5",
}));

const SectionBody = styled(Box)(() => ({
  backgroundColor: "#FAFAF8",
  padding: "24px",
}));

const SectionHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  backgroundColor: "#F6F4EE",
  padding: "12px 16px",
  border: "1px solid #D9D9D9",
}));

const IconWrapper = styled(Box)(() => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E5E0D3",
}));

const RedButton = styled(MuiButton)(() => ({
  backgroundColor: "#e7e3d9",
  color: "#B8252F",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  boxShadow: "0 2px 4px rgba(199, 32, 48, 0.2)",
}));

const CancelButton = styled(MuiButton)(() => ({
  backgroundColor: "#e7e3d9",
  color: "#C72030",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#e7e3d9",
  },
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
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "14px",
    "&.Mui-focused": {
      color: "#C72030",
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
    backgroundColor: "#f5f5f5",
  },
};

interface PricingRule {
  id: number;
  organization_id: number;
  generic_category_id: number;
  margin_type: string;
  margin_value: number;
}

const PricingRuleEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pricingRule, setPricingRule] = useState<PricingRule | null>(null);
  const [marginType, setMarginType] = useState<string>("percentage");
  const [marginValue, setMarginValue] = useState<string>("");
  const [platformFeeType, setPlatformFeeType] = useState<string>("percentage");
  const [platformFeeValue, setPlatformFeeValue] = useState<string>("");
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch organizations
    fetch("https://runwal-api.lockated.com/organizations.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ")
      .then((res) => res.json())
      .then((data) => setOrganizations(data.organizations || []))
      .catch(() => setOrganizations([]));

    // Fetch categories
    fetch("https://runwal-api.lockated.com/generic_categories?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));

    fetchPricingRule();
  }, [id]);

  const fetchPricingRule = async () => {
    setLoading(true);
    try {
      const url = `https://runwal-api.lockated.com/pricing_rules/${id}?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
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
    } catch (error) {
      toast.error("Failed to load pricing rule", {
        description: String(error),
      });
      navigate("/settings/pricing-rule-list");
    } finally {
      setLoading(false);
    }
  };

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
      const url = `https://runwal-api.lockated.com/pricing_rules/${id}?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <CircularProgress sx={{ color: "#C72030" }} />
      </Box>
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
        p: { xs: 2, sm: 4, lg: 6 },
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Toaster position="top-right" richColors closeButton />

      {/* Breadcrumb */}
      <Typography
        variant="body2"
        sx={{ mb: 3, color: "#666", fontFamily: "Work Sans, sans-serif" }}
      >
        Pricing Rules &gt; Edit
      </Typography>

      {/* Pricing Rule Form */}
      <SectionCard>
        <SectionHeader>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <IconWrapper>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C72030"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </IconWrapper>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Work Sans, sans-serif",
                textTransform: "uppercase",
                fontSize: "18px",
              }}
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
            <TextField
              label="Organization"
              value={getOrganizationName()}
              sx={disabledFieldStyles}
              fullWidth
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
            
            <TextField
              label="Category"
              value={getCategoryName()}
              sx={disabledFieldStyles}
              fullWidth
              disabled
              InputProps={{
                readOnly: true,
              }}
            />

            <FormControl fullWidth sx={fieldStyles}>
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

            <FormControl fullWidth sx={fieldStyles}>
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
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
        <RedButton onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Updating..." : "Update"}
        </RedButton>
        <CancelButton onClick={handleCancel} disabled={submitting}>
          Cancel
        </CancelButton>
      </Box>
    </Box>
  );
};

export default PricingRuleEdit;
