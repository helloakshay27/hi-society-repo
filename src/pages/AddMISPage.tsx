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
import { X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";

// Styled Components (match AddTicketDashboard)
const SectionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: "white",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  marginBottom: "24px",
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 24px",
  backgroundColor: "#F6F4EE",
  borderBottom: "1px solid #e5e7eb",
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  color: "#C72030",
  backgroundColor: "#E5E0D3",
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
  color: "#fff",
  borderRadius: "4px",
  textTransform: "none",
  padding: "10px 24px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#a01828",
    boxShadow: "none",
  },
  "&:disabled": {
    backgroundColor: "#e5e7eb",
    color: "#9ca3af",
  },
}));

const CancelButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: "#fff",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  textTransform: "none",
  padding: "10px 24px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#f9fafb",
    boxShadow: "none",
  },
}));

const AddButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: "#C4B89D59",
  color: "#C72030",
  borderRadius: "4px",
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#C4B89D80",
    boxShadow: "none",
  },
}));

const RemoveButton = styled(IconButton)(({ theme }) => ({
  color: "#C72030",
  padding: "4px",
  "&:hover": {
    backgroundColor: "#fef2f2",
  },
}));

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '45px',
    '& fieldset': {
      borderColor: '#ddd',
    },
    '&:hover fieldset': {
      borderColor: '#C72030',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C72030',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};

const multilineFieldStyles = {
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#ddd',
    },
    '&:hover fieldset': {
      borderColor: '#C72030',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C72030',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#C72030',
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
    const [isSubmitting, setIsSubmitting] = useState(false);
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
    setSections((prev) => [
      ...prev,
      { section: "", items: [{ ...defaultItem }] },
    ]);
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
        backgroundColor: "#f9fafb",
        padding: "24px",
        fontFamily: "Work Sans, sans-serif",
      }}
    >
      <Toaster position="top-right" richColors closeButton />
      <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#111827",
              margin: 0,
              fontFamily: "Work Sans, sans-serif",
            }}
          >
            Add MIS
          </h1>
        </Box>

        {/* MIS Section */}
        {sections.map((section, sectionIdx) => (
          <SectionCard key={sectionIdx} sx={{ mb: 3 }}>
            <SectionHeader>
              <IconWrapper>
                <FileText size={16} />
              </IconWrapper>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                  fontFamily: "Work Sans, sans-serif",
                  flex: 1,
                }}
              >
                Section {sectionIdx + 1}
              </h2>
                 <Box sx={{ display: "flex", justifyContent: "center" }}>
          <AddButton
            variant="contained"
            onClick={handleAddSection}
            type="button"
          >
            + Add Section
          </AddButton>
        </Box>
              {sections.length > 1 && (
                <RemoveButton onClick={() => handleRemoveSection(sectionIdx)}>
                  <X size={20} />
                </RemoveButton>
              )}
            
            </SectionHeader>
            <Box sx={{ padding: "24px", backgroundColor: "#AAB9C50D" }}>
              <TextField
                label="Section Name"
                value={section.section}
                onChange={(e) =>
                  handleSectionChange(sectionIdx, e.target.value)
                }
                sx={{ ...fieldStyles, mb: 3 }}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
              {section.items.map((item, itemIdx) => (
                <Box
                  key={itemIdx}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: "16px",
                    mb: 3,
                    alignItems: "flex-start",
                    position: "relative",
                    padding: "16px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {section.items.length > 1 && (
                    <RemoveButton
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                      }}
                      onClick={() => handleRemoveItem(sectionIdx, itemIdx)}
                    >
                      <X size={18} />
                    </RemoveButton>
                  )}
                  <TextField
                    label="Item"
                    value={item.item}
                    onChange={(e) =>
                      handleItemChange(
                        sectionIdx,
                        itemIdx,
                        "item",
                        e.target.value
                      )
                    }
                    sx={fieldStyles}
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    label="Snagging Status"
                    value={item.snaggingStatus}
                    onChange={(e) =>
                      handleItemChange(
                        sectionIdx,
                        itemIdx,
                        "snaggingStatus",
                        e.target.value
                      )
                    }
                    sx={fieldStyles}
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    label="Desnagging Status"
                    value={item.desnaggingStatus}
                    onChange={(e) =>
                      handleItemChange(
                        sectionIdx,
                        itemIdx,
                        "desnaggingStatus",
                        e.target.value
                      )
                    }
                    sx={fieldStyles}
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    label="Completion Date"
                    type="date"
                    value={item.completionDate}
                    onChange={(e) =>
                      handleItemChange(
                        sectionIdx,
                        itemIdx,
                        "completionDate",
                        e.target.value
                      )
                    }
                    sx={fieldStyles}
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    label="Handing Over To"
                    value={item.handingOverTo}
                    onChange={(e) =>
                      handleItemChange(
                        sectionIdx,
                        itemIdx,
                        "handingOverTo",
                        e.target.value
                      )
                    }
                    sx={fieldStyles}
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    label="Completion Remarks"
                    value={item.completionRemarks}
                    onChange={(e) =>
                      handleItemChange(
                        sectionIdx,
                        itemIdx,
                        "completionRemarks",
                        e.target.value
                      )
                    }
                    sx={{
                      ...multilineFieldStyles,
                      gridColumn: "1 / -1",
                    }}
                    fullWidth
                    multiline
                    minRows={3}
                    variant="outlined"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </Box>
              ))}
              <TextField
                label="Remarks"
                value={section.items[0]?.remarks || ""}
                onChange={(e) =>
                  handleItemChange(sectionIdx, 0, "remarks", e.target.value)
                }
                sx={{
                  ...multilineFieldStyles,
                  mb: 3,
                }}
                multiline
                minRows={3}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
              <AddButton
                variant="contained"
                onClick={() => handleAddItem(sectionIdx)}
                type="button"
              >
                + Add Item
              </AddButton>
            </Box>
          </SectionCard>
        ))}
       
       <div className="flex gap-4 justify-center pt-6">
  <Button
    type="submit"
    disabled={isSubmitting}
    onClick={handleSubmit}
    className="bg-red-600 hover:bg-red-700 text-white px-8 py-2"
  >
    {isSubmitting ? "Submitting..." : "Submit"}
  </Button>

  <Button
    type="button"
    variant="outline"
    onClick={handleCancel}
    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
  >
    Cancel
  </Button>
</div>

      </Box>
    </Box>
  );
};

export default AddMISPage;
