import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button as MuiButton,
  styled,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

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
  backgroundColor: "#C4B89D59",
  color: "#C72030",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
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

const AddOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
      <Box sx={{ width: "100%" }}>
        {/* Header */}
        <Paper
          sx={{
            backgroundColor: "#f6f4ee",
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
            Add Offer
          </h1>
        </Paper>

        {/* Offer Details Section */}
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
              Offer Details
            </h2>
          </SectionHeader>

          <Box sx={{ padding: "24px" }}>
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: "16px",
                  mb: 2,
                }}
              >
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={fieldStyles}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter Description"
                />
                <Box sx={{ gridColumn: { md: "span 2" }, mt: 1 }}>
                  <InputLabel sx={{ mb: 1 }}>Upload File</InputLabel>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ marginBottom: "16px" }}
                  />
                </Box>
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
                <RedButton type="submit">Save</RedButton>
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

export default AddOffersPage;
