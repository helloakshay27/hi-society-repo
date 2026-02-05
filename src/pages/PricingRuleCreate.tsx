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
  name: string;
  rule_type: string;
  discount_percentage: string;
  discount_amount: string;
  min_quantity: string;
  max_quantity: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
}

const PricingRuleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PricingRuleForm>({
    name: "",
    rule_type: "percentage",
    discount_percentage: "",
    discount_amount: "",
    min_quantity: "",
    max_quantity: "",
    start_date: "",
    end_date: "",
    status: "active",
    description: "",
  });

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Please enter pricing rule name");
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
      const token = localStorage.getItem("token") || "";
      const url = getFullUrl(`/pricing_rules.json?token=${token}`);

      const payload = {
        pricing_rule: {
          name: formData.name,
          rule_type: formData.rule_type,
          discount_percentage: formData.discount_percentage
            ? parseFloat(formData.discount_percentage)
            : null,
          discount_amount: formData.discount_amount
            ? parseFloat(formData.discount_amount)
            : null,
          min_quantity: formData.min_quantity
            ? parseInt(formData.min_quantity)
            : null,
          max_quantity: formData.max_quantity
            ? parseInt(formData.max_quantity)
            : null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status,
          description: formData.description,
        },
      };

      const options = getAuthenticatedFetchOptions("POST", payload);
      const response = await fetch(url, options);

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
              label="Rule Name"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter rule name"
              sx={fieldStyles}
              fullWidth
            />
            <FormControl fullWidth sx={fieldStyles}>
              <InputLabel id="rule-type-label">Rule Type</InputLabel>
              <Select
                labelId="rule-type-label"
                value={formData.rule_type}
                label="Rule Type"
                onChange={(e) => handleInputChange("rule_type", e.target.value)}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="flat">Flat</MenuItem>
              </Select>
            </FormControl>

            {formData.rule_type === "percentage" && (
              <TextField
                label="Discount Percentage"
                type="number"
                value={formData.discount_percentage}
                onChange={(e) =>
                  handleInputChange("discount_percentage", e.target.value)
                }
                placeholder="e.g., 10"
                sx={fieldStyles}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            )}

            {formData.rule_type === "flat" && (
              <TextField
                label="Discount Amount"
                type="number"
                value={formData.discount_amount}
                onChange={(e) =>
                  handleInputChange("discount_amount", e.target.value)
                }
                placeholder="e.g., 50"
                sx={fieldStyles}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            )}

            <TextField
              label="Minimum Quantity"
              type="number"
              value={formData.min_quantity}
              onChange={(e) =>
                handleInputChange("min_quantity", e.target.value)
              }
              placeholder="e.g., 1"
              sx={fieldStyles}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Maximum Quantity"
              type="number"
              value={formData.max_quantity}
              onChange={(e) =>
                handleInputChange("max_quantity", e.target.value)
              }
              placeholder="e.g., 100"
              sx={fieldStyles}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange("start_date", e.target.value)}
              sx={fieldStyles}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange("end_date", e.target.value)}
              sx={fieldStyles}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth sx={fieldStyles}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={formData.status}
                label="Status"
                onChange={(e) => handleInputChange("status", e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <div className="mb-8 mt-8 relative" style={{ gridColumn: 'span 2' }}>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Work Sans, sans-serif' }}
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-[#D5DbDB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-transparent resize-vertical"
              placeholder="Enter rule description"
              rows={6}
            />
          </div>
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
