import React, { useState } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Info } from "lucide-react";
import { QUARANTINE_MOCK_RECORDS } from "./quarantineTrackerData";

const TOWER_OPTIONS = ["A", "B", "C"];
const FLAT_OPTIONS = ["101", "102", "103"];

// Records store dates as dd/mm/yyyy; date inputs need yyyy-mm-dd
const toInputDate = (value?: string) => {
  const [dd, mm, yyyy] = (value || "").split("/");
  return dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : "";
};

const withCurrent = (options: string[], current: string) =>
  current && !options.includes(current) ? [...options, current] : options;

const AddQuarantinePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const existingRecord = isEditMode
    ? QUARANTINE_MOCK_RECORDS.find((r) => r.id === id)
    : undefined;

  const [tower, setTower] = useState(existingRecord?.tower ?? "");
  const [flat, setFlat] = useState(existingRecord?.flat ?? "");
  const [startDate, setStartDate] = useState(toInputDate(existingRecord?.startDate));
  const [endDate, setEndDate] = useState(toInputDate(existingRecord?.endDate));

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
    <div className="p-6 min-h-screen add-quarantine-page">
      <style>{`
        html body #root .add-quarantine-page {
          background-color: #FDFDFB !important;
        }
        html body #root .add-quarantine-page .ref-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09) !important;
          border-radius: 16px !important;
          box-shadow: none !important;
          overflow: hidden;
        }
        html body #root .add-quarantine-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .add-quarantine-page .ref-card-head h2 {
          margin: 0;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1A1A18 !important;
        }
        html body #root .add-quarantine-page .ref-chip {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .add-quarantine-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .add-quarantine-page .ref-card-body {
          padding: 20px 24px 22px;
        }
        html body #root .add-quarantine-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .add-quarantine-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .add-quarantine-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .add-quarantine-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .add-quarantine-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .add-quarantine-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
      `}</style>

      <div className="mb-[22px]">
        <div
          className="flex items-center gap-2 text-[13px] font-medium mb-3"
          style={{ color: "rgba(26, 26, 24, 0.48)" }}
        >
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Quarantine Tracker</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold" style={{ color: "#1A1A18" }}>
            {isEditMode ? "Edit Record" : "Add Record"}
          </span>
        </div>
        <h1
          className="text-[22px] font-semibold leading-tight tracking-[-0.015em]"
          style={{ color: "#1A1A18" }}
        >
          {isEditMode ? "Edit Quarantine Record" : "New Quarantine Record"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ref-card">
          <div className="ref-card-head">
            <span className="ref-chip">
              <Info />
            </span>
            <h2>Quarantine Details</h2>
          </div>

          <div className="ref-card-body grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormControl fullWidth>
              <InputLabel id="tower-label">Select Tower</InputLabel>
              <Select
                labelId="tower-label"
                value={tower}
                label="Select Tower"
                onChange={handleTowerChange}
              >
                {withCurrent(TOWER_OPTIONS, tower).map((option) => (
                  <MenuItem key={option} value={option}>
                    Tower {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="flat-label">Select Flat</InputLabel>
              <Select
                labelId="flat-label"
                value={flat}
                label="Select Flat"
                onChange={handleFlatChange}
              >
                {withCurrent(FLAT_OPTIONS, flat).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary h-9 px-4 text-sm font-medium">
            {isEditMode ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuarantinePage;
