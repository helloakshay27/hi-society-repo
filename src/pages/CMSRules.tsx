import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, Pencil, Check } from "lucide-react";
import {
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

interface Rule {
  id: string;
  triggerTo: string;
  periodType: string;
  periodValue: string;
}

const CMSRules: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [rules, setRules] = useState<Rule[]>([]);
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

  const fetchRules = async() => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/facility_setups.json?type=rules_setup`,{
        headers:{
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

  const handleSubmit = async() => {
    if (!formData.triggerTo || !formData.periodType || !formData.periodValue) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("q[][trigger_to]", formData.triggerTo);
      formDataToSend.append("q[][prior_to]", formData.periodType);
      formDataToSend.append("q[][prior_val]", formData.periodValue);

      await axios.post(`https://${baseUrl}/crm/admin/facility_rules.json`,formDataToSend,{
        headers:{
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
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id: string) => {
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
    }
  };

  const selectStyles = {
    backgroundColor: "#fff",
    "& .MuiOutlinedInput-root": {
      height: "36px",
      borderRadius: "4px",
      "& fieldset": {
        borderColor: "#ddd",
      },
    },
    "& .MuiSelect-select": {
      padding: "8px 12px",
      fontSize: "14px",
    },
  };

  const textFieldStyles = {
    backgroundColor: "#fff",
    "& .MuiOutlinedInput-root": {
      height: "36px",
      borderRadius: "4px",
      "& fieldset": {
        borderColor: "#ddd",
      },
    },
    "& .MuiOutlinedInput-input": {
      padding: "8px 12px",
      fontSize: "14px",
    },
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
    <div className="p-6 bg-[#fafafa] min-h-screen">
      {/* Configure Rule Section */}
      <div className="max-w-md bg-white rounded shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-[#efefef] p-3 border-l-4 border-[#f7941d] flex items-center">
          <Typography variant="subtitle1" fontWeight="600" color="#333">
            Configure Rule
          </Typography>
        </div>
        <div className="p-4">
          <div className="border border-dashed border-[#ccc] p-4 rounded space-y-4">
            <div className="space-y-1">
              <Typography variant="caption" color="textSecondary" fontWeight="500">
                Trigger an email to
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.triggerTo}
                  onChange={(e) => handleInputChange("triggerTo", e.target.value)}
                  displayEmpty
                  sx={selectStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="" disabled>Select</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Resident">Resident</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="space-y-1">
              <Typography variant="caption" color="textSecondary" fontWeight="500">
                Prior to membership expire date
              </Typography>
              <div className="flex gap-2">
                <FormControl sx={{ flex: 1, minWidth: "100px" }} size="small">
                  <Select
                    value={formData.periodType}
                    onChange={(e) => handleInputChange("periodType", e.target.value)}
                    displayEmpty
                    sx={selectStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled>Select</MenuItem>
                    <MenuItem value="days">Days</MenuItem>
                    <MenuItem value="months">Months</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.periodValue}
                  onChange={(e) => handleInputChange("periodValue", e.target.value)}
                  sx={textFieldStyles}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleSubmit}
              className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-8 py-2 h-auto text-sm font-semibold"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 border-dashed mb-8" />

      {/* Configured Rules Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule,idx) => {
          const isEditing = editingId === rule.id;
          return (
          <div key={rule.id} className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute right-2 top-2 z-10 flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => handleUpdate(rule.id)}
                    className="bg-green-600 text-white p-1 rounded hover:bg-green-700 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEditStart(rule)}
                    className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="bg-[#d9534f] text-white p-1 rounded hover:bg-[#c9302c] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
            <div className="bg-[#efefef] p-3 border-l-4 border-[#f7941d] flex items-center pr-20">
              <Typography variant="subtitle2" fontWeight="600" color="#333">
                Rule {idx + 1}
              </Typography>
            </div>
            <div className="p-4">
              <div className="border border-dashed border-[#ccc] p-4 rounded space-y-4 bg-[#fcfcfc]">
                <div className="space-y-1">
                  <Typography variant="caption" color="textSecondary" fontWeight="500">
                    Trigger an email to
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={isEditing ? editFormData.triggerTo : rule.triggerTo}
                      onChange={(e) => handleEditInputChange("triggerTo", e.target.value)}
                      disabled={!isEditing}
                      sx={{
                        ...selectStyles,
                        backgroundColor: isEditing ? "#fff" : "#f9f9f9",
                        "& .MuiSelect-select.Mui-disabled": {
                          WebkitTextFillColor: "#333",
                        },
                      }}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="Resident">Resident</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="space-y-1">
                  <Typography variant="caption" color="textSecondary" fontWeight="500">
                    Prior to membership expire date
                  </Typography>
                  <div className="flex gap-2">
                    <FormControl sx={{ flex: 1, minWidth: "100px" }} size="small">
                      <Select
                        value={isEditing ? editFormData.periodType : rule.periodType}
                        onChange={(e) => handleEditInputChange("periodType", e.target.value)}
                        disabled={!isEditing}
                        sx={{
                          ...selectStyles,
                          backgroundColor: isEditing ? "#fff" : "#f9f9f9",
                          "& .MuiSelect-select.Mui-disabled": {
                            WebkitTextFillColor: "#333",
                          },
                        }}
                        MenuProps={menuProps}
                      >
                        <MenuItem value="days">Days</MenuItem>
                        <MenuItem value="months">Months</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      size="small"
                      value={isEditing ? editFormData.periodValue : rule.periodValue}
                      onChange={(e) => handleEditInputChange("periodValue", e.target.value)}
                      disabled={!isEditing}
                      sx={{
                        ...textFieldStyles,
                        backgroundColor: isEditing ? "#fff" : "#f9f9f9",
                        "& .MuiOutlinedInput-input.Mui-disabled": {
                          WebkitTextFillColor: "#333",
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default CMSRules;
