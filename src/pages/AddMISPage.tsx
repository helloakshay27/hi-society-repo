import React, { useState } from "react";
import { TextField } from "@mui/material";
import { X, FileText, Plus, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
    <div className="p-6 min-h-screen add-mis-page">
      <style>{`
        html body #root .add-mis-page {
          background-color: #FDFDFB !important;
        }
        html body #root .add-mis-page .ref-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 16px;
          overflow: hidden;
        }
        html body #root .add-mis-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .add-mis-page .ref-card-head h2 {
          flex: 1;
          margin: 0;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1A1A18 !important;
        }
        html body #root .add-mis-page .ref-chip {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .add-mis-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .add-mis-page .ref-card-body {
          padding: 20px 24px 22px;
        }
        html body #root .add-mis-page .ref-item {
          position: relative;
          padding: 16px;
          background: #FFFFFF !important;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 12px;
        }
        html body #root .add-mis-page .ref-item-title {
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(26, 26, 24, 0.55);
        }
        html body #root .add-mis-page .ref-icon-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: rgba(26, 26, 24, 0.55);
          transition: background-color 0.16s, color 0.16s;
        }
        html body #root .add-mis-page .ref-icon-btn:hover {
          background: #F5F4F0;
          color: #1A1A18;
        }
        html body #root .add-mis-page .ref-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(26, 26, 24, 0.68);
        }
        html body #root .add-mis-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .add-mis-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .add-mis-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .add-mis-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .add-mis-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .add-mis-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        html body #root .add-mis-page .ref-textarea {
          display: block;
          width: 100%;
          min-height: 96px;
          padding: 12px 14px !important;
          font-size: 13.5px !important;
          font-weight: 500;
          line-height: 1.5;
          color: #1A1A18;
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: none;
          outline: none;
          resize: vertical;
          transition: border-color 0.16s, box-shadow 0.16s;
        }
        html body #root .add-mis-page .ref-textarea:hover {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .add-mis-page .ref-textarea:focus {
          border-color: #1A1A18 !important;
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
      `}</style>

      <div className="mb-[22px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>MIS</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#1A1A18]">Add MIS</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          New MIS
        </h1>
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="ref-card">
            <div className="ref-card-head">
              <span className="ref-chip">
                <FileText />
              </span>
              <h2>Section {sectionIdx + 1}</h2>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSection(sectionIdx)}
                  className="ref-icon-btn"
                  aria-label={`Remove section ${sectionIdx + 1}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="ref-card-body space-y-5">
              <TextField
                label="Section Name"
                value={section.section}
                onChange={(e) => handleSectionChange(sectionIdx, e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="ref-item">
                  <div className="flex items-center justify-between">
                    <div className="ref-item-title">Item {itemIdx + 1}</div>
                    {section.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(sectionIdx, itemIdx)}
                        className="ref-icon-btn -mt-3"
                        aria-label={`Remove item ${itemIdx + 1}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      label="Item"
                      value={item.item}
                      onChange={(e) =>
                        handleItemChange(sectionIdx, itemIdx, "item", e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Snagging Status"
                      value={item.snaggingStatus}
                      onChange={(e) =>
                        handleItemChange(sectionIdx, itemIdx, "snaggingStatus", e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Desnagging Status"
                      value={item.desnaggingStatus}
                      onChange={(e) =>
                        handleItemChange(sectionIdx, itemIdx, "desnaggingStatus", e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Completion Date"
                      type="date"
                      value={item.completionDate}
                      onChange={(e) =>
                        handleItemChange(sectionIdx, itemIdx, "completionDate", e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Handing Over To"
                      value={item.handingOverTo}
                      onChange={(e) =>
                        handleItemChange(sectionIdx, itemIdx, "handingOverTo", e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <div className="md:col-span-3">
                      <label
                        htmlFor={`mis-completion-remarks-${sectionIdx}-${itemIdx}`}
                        className="ref-label"
                      >
                        Completion Remarks
                      </label>
                      <textarea
                        id={`mis-completion-remarks-${sectionIdx}-${itemIdx}`}
                        value={item.completionRemarks}
                        onChange={(e) =>
                          handleItemChange(sectionIdx, itemIdx, "completionRemarks", e.target.value)
                        }
                        rows={3}
                        className="ref-textarea"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label htmlFor={`mis-remarks-${sectionIdx}`} className="ref-label">
                  Remarks
                </label>
                <textarea
                  id={`mis-remarks-${sectionIdx}`}
                  value={section.items[0]?.remarks || ""}
                  onChange={(e) => handleItemChange(sectionIdx, 0, "remarks", e.target.value)}
                  rows={3}
                  className="ref-textarea"
                />
              </div>

              <button
                type="button"
                onClick={() => handleAddItem(sectionIdx)}
                className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddSection}
          className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          variant="ghost"
          className="btn-primary h-9 px-4 text-sm font-medium"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default AddMISPage;
