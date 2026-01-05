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
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

// Styled Components (copied from AddUserPage)
const SectionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: "white",
  boxShadow:
    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
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

const AddQuarantinePage: React.FC = () => {
  const navigate = useNavigate();
  const [tower, setTower] = useState("");
  const [flat, setFlat] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      <Box sx={{ maxWidth: "800px", margin: "0 auto" }}>
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
            Add Flat to Quarantine
          </h1>
        </Paper>

        {/* Quarantine Details Section */}
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
              Quarantine Details
            </h2>
          </SectionHeader>

          <Box sx={{ padding: "24px" }}>
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, 1fr)",
                  },
                  gap: "16px",
                  mb: 2,
                }}
              >
                <FormControl fullWidth sx={fieldStyles}>
                  <InputLabel>Select Tower</InputLabel>
                  <Select
                    value={tower}
                    label="Select Tower"
                    onChange={(e) => setTower(e.target.value)}
                  >
                    <MenuItem value="A">Tower A</MenuItem>
                    <MenuItem value="B">Tower B</MenuItem>
                    <MenuItem value="C">Tower C</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={fieldStyles}>
                  <InputLabel>Select Flat</InputLabel>
                  <Select
                    value={flat}
                    label="Select Flat"
                    onChange={(e) => setFlat(e.target.value)}
                  >
                    <MenuItem value="101">101</MenuItem>
                    <MenuItem value="102">102</MenuItem>
                    <MenuItem value="103">103</MenuItem>
                  </Select>
                </FormControl>
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
              </Box>
              <Typography sx={{ mt: 2, mb: 1, fontWeight: 500 }}>
                List of Residents
              </Typography>
              {/* Placeholder for residents list */}
              <Box sx={{ minHeight: 32, mb: 3, color: "#888" }}>
                {/* TODO: Populate with residents */}
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

export default AddQuarantinePage;
