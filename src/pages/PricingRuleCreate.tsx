import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthenticatedFetchOptions } from "@/config/apiConfig";
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

interface PricingRuleForm {
  organization_id: string;
  generic_category_id: string;
  margin_type: string;
  margin_value: string;
}

const PricingRuleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PricingRuleForm>({
    organization_id: "",
    generic_category_id: "",
    margin_type: "percentage",
    margin_value: "",
  });

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.organization_id.trim()) {
      toast.error("Please enter organization ID");
      return false;
    }
    if (!formData.generic_category_id.trim()) {
      toast.error("Please enter category ID");
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
      const url = "http://localhost:3000/pricing_rules";
      const payload = {
        pricing_rule: {
          organization_id: parseInt(formData.organization_id),
          generic_category_id: parseInt(formData.generic_category_id),
          margin_type: formData.margin_type,
          margin_value: parseFloat(formData.margin_value),
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
        Pricing Rules &gt; Create
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
            <TextField
              label="Organization ID"
              required
              type="number"
              value={formData.organization_id}
              onChange={(e) => handleInputChange("organization_id", e.target.value)}
              placeholder="e.g., 9"
              sx={fieldStyles}
              fullWidth
            />
            
            <TextField
              label="Generic Category ID"
              required
              type="number"
              value={formData.generic_category_id}
              onChange={(e) => handleInputChange("generic_category_id", e.target.value)}
              placeholder="e.g., 1"
              sx={fieldStyles}
              fullWidth
            />

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
          </Box>
        </SectionBody>
      </SectionCard>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
        <RedButton onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </RedButton>
        <CancelButton onClick={handleCancel} disabled={submitting}>
          Cancel
        </CancelButton>
      </Box>
    </Box>
  );
};

export default PricingRuleCreate;
