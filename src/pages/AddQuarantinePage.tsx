import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button as MuiButton,
  styled,
  TextareaAutosize,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { X, Calendar, Info } from "lucide-react";

// Styled Components
const SectionCard = styled(Paper)({
  backgroundColor: "white",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  borderRadius: 0,
  overflow: "hidden",
  marginBottom: "24px",
});

const SectionHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 24px",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
});

const RedIcon = styled(Box)({
  color: "white",
  backgroundColor: "#C72030",
  borderRadius: "50%",
  padding: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
});

const RedButton = styled(MuiButton)({
  backgroundColor: "#C72030",
  color: "white",
  "&:hover": {
    backgroundColor: "#a61a2a",
  },
  textTransform: "none",
  padding: "8px 16px",
  borderRadius: 0,
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  fontSize: "0.875rem",
  lineHeight: "1.5",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#B8252F",
    boxShadow: "0 4px 8px rgba(199, 32, 48, 0.3)",
  },
});

const DraftButton = styled(MuiButton)({
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
});

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

  const handleTowerChange = (event: SelectChangeEvent) => {
    setTower(event.target.value as string);
  };

  const handleFlatChange = (event: SelectChangeEvent) => {
    setFlat(event.target.value as string);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit logic
    console.log({ tower, flat, startDate, endDate });
    // navigate(-1);
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
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#1A1A1A" }}>
            Add Quarantine Record
          </Typography>
        </Paper>

        {/* Quarantine Details Section */}
        <SectionCard>
          <SectionHeader>
            <RedIcon>
              <Info size={16} />
            </RedIcon>
            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600, color: "#1A1A1A" }}>
              Quarantine Details
            </Typography>
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
                  mb: 3,
                }}
              >
                <FormControl fullWidth sx={fieldStyles}>
                  <InputLabel id="tower-label">Select Tower</InputLabel>
                  <Select
                    labelId="tower-label"
                    value={tower}
                    label="Select Tower"
                    onChange={handleTowerChange}
                  >
                    <MenuItem value="A">Tower A</MenuItem>
                    <MenuItem value="B">Tower B</MenuItem>
                    <MenuItem value="C">Tower C</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={fieldStyles}>
                  <InputLabel id="flat-label">Select Flat</InputLabel>
                  <Select
                    labelId="flat-label"
                    value={flat}
                    label="Select Flat"
                    onChange={handleFlatChange}
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

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <DraftButton
                  
                  onClick={handleCancel}
                  startIcon={<X size={16} />}
                >
                  Cancel
                </DraftButton>
                <RedButton
                  type="submit"
                  variant="contained"
                  startIcon={<Info size={16} />}
                >
                  Save
                </RedButton>
              </Box>
            </form>
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
};

export default AddQuarantinePage;
