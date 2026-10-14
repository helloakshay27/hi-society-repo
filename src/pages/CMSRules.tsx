import React, { useEffect, useState } from "react";
import { X, Trash2, Pencil, Check, Loader, Mail, ListChecks } from "lucide-react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface Rule {
  id: string;
  triggerTo: string;
  periodType: string;
  periodValue: string;
}

const CMSRules: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const { shouldShow } = useDynamicPermissions()

  const [rules, setRules] = useState<Rule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    triggerTo: "",
    periodType: "",
    periodValue: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    triggerTo: "",
    periodType: "",
    periodValue: "",
  });

  const fetchRules = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/facility_setups.json?type=rules_setup`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })
      setRules(response.data.map(item => ({
        id: item.id,
        triggerTo: item.trigger_to,
        periodType: item.prior_to,
        periodValue: item.prior_val,
      })))
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchRules();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.triggerTo || !formData.periodType || !formData.periodValue) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("q[][trigger_to]", formData.triggerTo);
      formDataToSend.append("q[][prior_to]", formData.periodType);
      formDataToSend.append("q[][prior_val]", formData.periodValue);

      await axios.post(`https://${baseUrl}/crm/admin/facility_rules.json`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      setFormData({
        triggerTo: "",
        periodType: "",
        periodValue: "",
      })
      toast.success("Rule added successfully");
      fetchRules();
    } catch (error) {
      console.log(error)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStart = (rule: Rule) => {
    setEditingId(rule.id);
    setEditFormData({
      triggerTo: rule.triggerTo,
      periodType: rule.periodType,
      periodValue: rule.periodValue,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({
      triggerTo: "",
      periodType: "",
      periodValue: "",
    });
  };

  const handleUpdate = async (id: string) => {
    if (!editFormData.triggerTo || !editFormData.periodType || !editFormData.periodValue) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("facility_rule[trigger_to]", editFormData.triggerTo);
      formDataToSend.append("facility_rule[prior_to]", editFormData.periodType);
      formDataToSend.append("facility_rule[prior_val]", editFormData.periodValue);

      await axios.patch(`https://${baseUrl}/crm/admin/facility_rules/${id}.json`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      toast.success("Rule updated successfully");
      setEditingId(null);
      fetchRules();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast.error("Failed to update rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await axios.delete(`https://${baseUrl}/crm/admin/facility_rules/${id}.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setRules(rules.filter((rule) => rule.id !== id));
      toast.success("Rule deleted successfully");
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Failed to delete rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 250,
      },
    },
    disableScrollLock: true,
  };

  return (
    <div className="p-6 min-h-screen cms-rules-page">
      <style>{`
        html body #root .cms-rules-page {
          background-color: #FDFDFB !important;
        }
        html body #root .cms-rules-page .ref-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 16px;
          overflow: hidden;
        }
        html body #root .cms-rules-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .cms-rules-page .ref-card-head h2 {
          flex: 1;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A18;
        }
        html body #root .cms-rules-page .ref-chip {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .cms-rules-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .cms-rules-page .ref-card-body {
          padding: 20px 24px 22px;
        }
        html body #root .cms-rules-page .ref-icon-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: rgba(26, 26, 24, 0.6);
          border: 1px solid rgba(26, 26, 24, 0.1);
          background: #FFFFFF;
          transition: background-color 0.16s, color 0.16s;
        }
        html body #root .cms-rules-page .ref-icon-btn:hover {
          background: #F5F4F0;
          color: #1A1A18;
        }
        html body #root .cms-rules-page .ref-icon-btn.is-danger:hover {
          color: #A63D49;
        }
        html body #root .cms-rules-page .ref-icon-btn.is-primary {
          background: #1A1A18;
          border-color: #1A1A18;
          color: #FFFFFF;
        }
        html body #root .cms-rules-page .ref-icon-btn.is-primary:hover {
          background: #2E2E2B;
        }
        html body #root .cms-rules-page .ref-icon-btn svg {
          color: inherit !important;
          stroke: currentColor !important;
        }
        html body #root .cms-rules-page .btn-primary svg {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }
        html body #root .cms-rules-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .cms-rules-page .MuiOutlinedInput-root.Mui-disabled {
          background-color: #FAF9F7 !important;
        }
        html body #root .cms-rules-page .Mui-disabled {
          -webkit-text-fill-color: #1A1A18 !important;
          color: #1A1A18 !important;
        }
        html body #root .cms-rules-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .cms-rules-page .MuiOutlinedInput-root:not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .cms-rules-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .cms-rules-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .cms-rules-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          -webkit-text-fill-color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
      `}</style>

      <div className="mb-6">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          Rules
        </h1>
        <p className="mt-1 text-[13px] text-[rgba(26,26,24,0.55)]">
          Send reminder emails before a membership expires
        </p>
      </div>

      {/* Configure Rule Section */}
      <div className="ref-card">
        <div className="ref-card-head">
          <span className="ref-chip">
            <Mail />
          </span>
          <h2>Configure Rule</h2>
        </div>
        <div className="ref-card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormControl fullWidth>
            <InputLabel shrink>Trigger an email to</InputLabel>
            <Select
              value={formData.triggerTo}
              onChange={(e) => handleInputChange("triggerTo", e.target.value)}
              label="Trigger an email to"
              notched
              displayEmpty
              MenuProps={menuProps}
            >
              <MenuItem value="" disabled>Select Trigger To*</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Resident">Resident</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Prior to membership expire date</InputLabel>
            <Select
              value={formData.periodType}
              onChange={(e) => handleInputChange("periodType", e.target.value)}
              label="Prior to membership expire date"
              notched
              displayEmpty
              MenuProps={menuProps}
            >
              <MenuItem value="" disabled>Select</MenuItem>
              <MenuItem value="days">Days</MenuItem>
              <MenuItem value="months">Months</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Value"
            placeholder="Enter value"
            value={formData.periodValue}
            onChange={(e) => handleInputChange("periodValue", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>
      </div>

      {shouldShow("Rules", "create") && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary h-9 px-4 text-sm font-medium inline-flex items-center gap-2"
          >
            {isSubmitting && <Loader size={14} className="animate-spin" />}
            Submit
          </Button>
        </div>
      )}

      {/* Configured Rules Section */}
      {rules.length > 0 && (
        <h2 className="mt-8 mb-4 text-[14px] font-semibold text-[#1A1A18]">
          Configured Rules
          <span className="ml-2 text-[12px] font-medium text-[rgba(26,26,24,0.48)]">
            {rules.length}
          </span>
        </h2>
      )}
      <div className="w-full flex flex-col gap-6">
        {rules.map((rule, idx) => {
          const isEditing = editingId === rule.id;
          return (
            <div key={rule.id} className="ref-card">
              <div className="ref-card-head">
                <span className="ref-chip">
                  <ListChecks />
                </span>
                <h2>Rule {idx + 1}</h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        disabled={isSubmitting}
                        className="ref-icon-btn"
                        aria-label="Cancel editing"
                      >
                        <X size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(rule.id)}
                        disabled={isSubmitting}
                        className="ref-icon-btn is-primary"
                        aria-label="Save rule"
                      >
                        <Check size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      {shouldShow("Rules", "update") && (
                        <button
                          type="button"
                          onClick={() => handleEditStart(rule)}
                          className="ref-icon-btn"
                          aria-label="Edit rule"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {shouldShow("Rules", "destroy") && (
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
                          className="ref-icon-btn is-danger"
                          aria-label="Delete rule"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="ref-card-body grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormControl fullWidth>
                  <InputLabel shrink>Trigger an email to</InputLabel>
                  <Select
                    value={isEditing ? editFormData.triggerTo : rule.triggerTo}
                    onChange={(e) => handleEditInputChange("triggerTo", e.target.value)}
                    disabled={!isEditing}
                    label="Trigger an email to"
                    notched
                    displayEmpty
                    MenuProps={menuProps}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Resident">Resident</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel shrink>Prior to membership expire date</InputLabel>
                  <Select
                    value={isEditing ? editFormData.periodType : rule.periodType}
                    onChange={(e) => handleEditInputChange("periodType", e.target.value)}
                    disabled={!isEditing}
                    label="Prior to membership expire date"
                    notched
                    displayEmpty
                    MenuProps={menuProps}
                  >
                    <MenuItem value="days">Days</MenuItem>
                    <MenuItem value="months">Months</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Value"
                  value={isEditing ? editFormData.periodValue : rule.periodValue}
                  onChange={(e) => handleEditInputChange("periodValue", e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CMSRules;
