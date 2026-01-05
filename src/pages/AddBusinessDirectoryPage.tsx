import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button as MuiButton,
  styled,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Info, Plus } from "lucide-react";

// Styled Components (same as AddUserPage/AddQuarantinePage)
const SectionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: "white",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  borderRadius: 0,
  overflow: "hidden",
  marginBottom: "24px",
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 24px",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
}));

const RedIcon = styled(Box)(({ theme }) => ({
  color: "white",
  backgroundColor: "#C72030",
  borderRadius: "50%",
  padding: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
}));

const RedButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: "#C72030",
  color: "white",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  boxShadow: "0 2px 4px rgba(199, 32, 48, 0.2)",
  "&:hover": {
    backgroundColor: "#B8252F",
    boxShadow: "0 4px 8px rgba(199, 32, 48, 0.3)",
  },
}));

const DraftButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: "#e7e3d9",
  color: "#C72030",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#d9d5c9",
  },
}));

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    fontSize: "14px",
    backgroundColor: "#fff",
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
};

const GalleryBox = styled(Box)({
  border: "1px dashed #bbb",
  borderRadius: 4,
  width: 80,
  height: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  marginTop: 8,
  marginBottom: 16,
  color: "#888",
  fontSize: 32,
  background: "#fafafa",
  transition: "border-color 0.2s",
  "&:hover": {
    borderColor: "#C72030",
    color: "#C72030",
  },
});

const AddBusinessDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    address: "",
    mobile: "",
    landline1: "",
    landline2: "",
    extIntercom: "",
    primaryEmail: "",
    secondaryEmail: "",
    website: "",
    category: "",
    subCategory: "",
    keyOffering: "",
    description: "",
    profile: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setLogo(e.target.files[0]);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setGallery([...gallery, e.target.files[0]]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit logic
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        padding: "24px",
        fontFamily: "Work Sans, sans-serif",
      }}
    >
      <Box sx={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <Paper
          sx={{
            backgroundColor: "white",
            borderRadius: 0,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
            padding: "16px 24px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#1A1A1A",
              margin: 0,
              fontFamily: "Work Sans, sans-serif",
            }}
          >
            Add Business Directory
          </h1>
        </Paper>

        {/* Business Directory Details Section */}
        <SectionCard>
          <SectionHeader>
            <RedIcon>
              <Info size={16} />
            </RedIcon>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
                margin: 0,
                fontFamily: "Work Sans, sans-serif",
              }}
            >
              Business Details
            </h2>
          </SectionHeader>

          <Box sx={{ padding: "24px" }}>
            <form onSubmit={handleSubmit}>
              {/* Company Logo */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Company Logo</Typography>
                <label htmlFor="logo-upload">
                  <Box
                    sx={{
                      border: "2px dashed #bbb",
                      borderRadius: 2,
                      width: 140,
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "#fafafa",
                      mb: 1,
                    }}
                  >
                    {logo ? (
                      <img
                        src={URL.createObjectURL(logo)}
                        alt="Logo"
                        style={{ maxHeight: 60, maxWidth: 120 }}
                      />
                    ) : (
                      <Typography sx={{ color: "#888", fontWeight: 500 }}>Browse</Typography>
                    )}
                  </Box>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                </label>
              </Box>
              {/* Form Fields */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: "16px",
                  mb: 2,
                }}
              >
                <TextField
                  label="Company Name"
                  value={form.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Contact Person Name"
                  value={form.contactPerson}
                  onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Address"
                  value={form.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                  multiline
                  rows={2}
                />
                <Box />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Mobile"
                    value={form.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    sx={fieldStyles}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          +91
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Landline 1"
                    value={form.landline1}
                    onChange={(e) => handleInputChange("landline1", e.target.value)}
                    sx={fieldStyles}
                    fullWidth
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Landline 2"
                    value={form.landline2}
                    onChange={(e) => handleInputChange("landline2", e.target.value)}
                    sx={fieldStyles}
                    fullWidth
                  />
                  <TextField
                    label="Ext / Intercom"
                    value={form.extIntercom}
                    onChange={(e) => handleInputChange("extIntercom", e.target.value)}
                    sx={fieldStyles}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Primary Email"
                  value={form.primaryEmail}
                  onChange={(e) => handleInputChange("primaryEmail", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Secondary Email"
                  value={form.secondaryEmail}
                  onChange={(e) => handleInputChange("secondaryEmail", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Website"
                  value={form.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <FormControl fullWidth sx={fieldStyles}>
                  <InputLabel>Select Category</InputLabel>
                  <Select
                    value={form.category}
                    label="Select Category"
                    onChange={(e) => handleInputChange("category", e.target.value)}
                  >
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="Retail">Retail</MenuItem>
                    <MenuItem value="Consulting">Consulting</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Sub Category"
                  value={form.subCategory}
                  onChange={(e) => handleInputChange("subCategory", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Key Offering"
                  value={form.keyOffering}
                  onChange={(e) => handleInputChange("keyOffering", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                  multiline
                  rows={2}
                />
                <TextField
                  label="Profile"
                  value={form.profile}
                  onChange={(e) => handleInputChange("profile", e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Box>
              {/* Gallery Upload */}
              <Typography sx={{ mt: 2, mb: 1, fontWeight: 500 }}>
                Gallery
              </Typography>
              <label htmlFor="gallery-upload">
                <GalleryBox>
                  <Plus size={32} />
                </GalleryBox>
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleGalleryChange}
                  multiple
                />
              </label>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                {gallery.map((file, idx) => (
                  <img
                    key={idx}
                    src={URL.createObjectURL(file)}
                    alt={`gallery-${idx}`}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid #eee" }}
                  />
                ))}
              </Box>
              <Box
                sx={{
                  borderTop: "1px solid #e5e7eb",
                  padding: "16px 0 0 0",
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <RedButton type="submit">Submit</RedButton>
                <DraftButton type="button" onClick={handleCancel}>
                  Cancel
                </DraftButton>
              </Box>
            </form>
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
};

export default AddBusinessDirectoryPage;
