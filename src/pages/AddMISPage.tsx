import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button as MuiButton,
  styled,
  IconButton,
  Typography,
} from "@mui/material";
import { X, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Styled Components (match AddUserPage/AddQuarantinePage)
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
  color: "red",
  backgroundColor: "#C4B89D59",
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
  boxShadow: "0 2px 4px rgba(199, 32, 48, 0.2)",
  "&:hover": {
    backgroundColor: "#C4B89D59",
   
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

const RemoveButton = styled(IconButton)(({ theme }) => ({
  color: "#C72030",
  marginLeft: 8,
  "&:hover": {
    backgroundColor: "#fbeaec",
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

type MISItem = {
  item?: string;
  snaggingStatus?: string;
  desnaggingStatus?: string;
  completionDate?: string;
  handingOverTo?: string;
  completionRemarks?: string;
  remarks?: string;
};

type MISSection = {
  section: string;
  items: MISItem[];
};

const defaultItem = {
  item: "",
  snaggingStatus: "",
  desnaggingStatus: "",
  completionDate: "",
  handingOverTo: "",
  completionRemarks: "",
  remarks: "",
};

const AddMISPage: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<MISSection[]>([
    { section: "", items: [{ ...defaultItem }] },
  ]);

  // Section handlers
  const handleSectionChange = (idx: number, value: string) => {
    setSections((prev) =>
      prev.map((sec, i) => (i === idx ? { ...sec, section: value } : sec))
    );
  };

  const handleRemoveSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSection = () => {
    setSections((prev) => [...prev, { section: "", items: [{ ...defaultItem }] }]);
  };

  // Item handlers
  const handleItemChange = (
    sectionIdx: number,
    itemIdx: number,
    field: keyof MISItem,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((sec, i) =>
        i === sectionIdx
          ? {
              ...sec,
              items: sec.items.map((item, j) =>
                j === itemIdx ? { ...item, [field]: value } : item
              ),
            }
          : sec
      )
    );
  };

  const handleAddItem = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((sec, i) =>
        i === sectionIdx
          ? { ...sec, items: [...sec.items, { ...defaultItem }] }
          : sec
      )
    );
  };

  const handleRemoveItem = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((sec, i) =>
        i === sectionIdx
          ? { ...sec, items: sec.items.filter((_, j) => j !== itemIdx) }
          : sec
      )
    );
  };

  // Submit
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
      <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <Paper
          sx={{
            backgroundColor: "#F6F4EE",
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
              color: "#000000",
              margin: 0,
              fontFamily: "Work Sans, sans-serif",
            }}
          >
            Add MIS
          </h1>
        </Paper>

        {/* MIS Section */}
        {sections.map((section, sectionIdx) => (
          <SectionCard key={sectionIdx} sx={{ mb: 3 }}>
            <SectionHeader>
              <RedIcon>
                <Info size={16} />
              </RedIcon>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000000",
                  margin: 0,
                  fontFamily: "Work Sans, sans-serif",
                }}
              >
                Section {sectionIdx + 1}
              </h2>
              {sections.length > 1 && (
                <RemoveButton onClick={() => handleRemoveSection(sectionIdx)}>
                  <X size={20} />
                </RemoveButton>
              )}
            </SectionHeader>
            <Box sx={{ padding: "24px" }}>
              <TextField
                label="Section Name"
                value={section.section}
                onChange={(e) => handleSectionChange(sectionIdx, e.target.value)}
                sx={{ ...fieldStyles, mb: 2, maxWidth: 400 }}
                size="small"
                fullWidth
              />
              {section.items.map((item, itemIdx) => (
                <Box
                  key={itemIdx}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: "16px",
                    mb: 2,
                    alignItems: "flex-start",
                  }}
                >
                  <TextField
                    label="Item"
                    value={item.item}
                    onChange={(e) =>
                      handleItemChange(sectionIdx, itemIdx, "item", e.target.value)
                    }
                    sx={fieldStyles}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Snagging Status"
                    value={item.snaggingStatus}
                    onChange={(e) =>
                      handleItemChange(sectionIdx, itemIdx, "snaggingStatus", e.target.value)
                    }
                    sx={fieldStyles}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Desnagging Status"
                    value={item.desnaggingStatus}
                    onChange={(e) =>
                      handleItemChange(sectionIdx, itemIdx, "desnaggingStatus", e.target.value)
                    }
                    sx={fieldStyles}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Completion Date"
                    type="date"
                    value={item.completionDate}
                    onChange={(e) =>
                      handleItemChange(sectionIdx, itemIdx, "completionDate", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={fieldStyles}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Handing Over To"
                    value={item.handingOverTo}
                    onChange={(e) =>
                      handleItemChange(sectionIdx, itemIdx, "handingOverTo", e.target.value)
                    }
                    sx={fieldStyles}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Completion Remarks"
                    value={item.completionRemarks}
                    onChange={(e) =>
                      handleItemChange(sectionIdx, itemIdx, "completionRemarks", e.target.value)
                    }
                    sx={fieldStyles}
                    size="small"
                    fullWidth
                    multiline
                  />
                  {section.items.length > 1 && (
                    <RemoveButton
                      sx={{ alignSelf: "center" }}
                      onClick={() => handleRemoveItem(sectionIdx, itemIdx)}
                    >
                      <X size={20} />
                    </RemoveButton>
                  )}
                </Box>
              ))}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <TextField
                  label="Remarks"
                  value={section.items[0]?.remarks || ""}
                  onChange={(e) =>
                    handleItemChange(sectionIdx, 0, "remarks", e.target.value)
                  }
                  sx={{ ...fieldStyles, flex: 1, background: "#fff" }}
                  size="small"
                  multiline
                  fullWidth
                />
                <RemoveButton
                  onClick={() => handleItemChange(sectionIdx, 0, "remarks", "")}
                  sx={{ alignSelf: "flex-start" }}
                >
                  <X size={20} />
                </RemoveButton>
              </Box>
              <RedButton
                variant="contained"
                sx={{ mt: 1 }}
                onClick={() => handleAddItem(sectionIdx)}
                type="button"
              >
                + Add Item
              </RedButton>
            </Box>
          </SectionCard>
        ))}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <RedButton
            variant="contained"
            onClick={handleAddSection}
            type="button"
          >
            + Add Section
          </RedButton>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
          <RedButton type="submit" onClick={handleSubmit}>
            Save
          </RedButton>
          <DraftButton type="button" onClick={handleCancel}>
            Cancel
          </DraftButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AddMISPage;
