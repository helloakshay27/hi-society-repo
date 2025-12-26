import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Lock } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { Button } from "@/components/ui/button";

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


const LockFunctionCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [parentFunctions, setParentFunctions] = useState([]);
  const [showActionName, setShowActionName] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    action_name: "",
    parent_function: "All Functions",
    active: 1,
  });

  // Fetch existing lock functions to get possible parent functions
  useEffect(() => {
    const fetchParentFunctions = async () => {
      try {
        const response = await axios.get(`${baseURL}/lock_functions.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });

        const functionsData = Array.isArray(response.data) ? response.data : [];
        const uniqueParentFunctions = [
          ...new Set(functionsData.map((func) => func.parent_function)),
        ].filter(Boolean);

        const parentFunctionOptions = uniqueParentFunctions.map((func) => ({
          id: func,
          name: func,
        }));

        // Add "all_functions" if it's not already in the list
        if (!uniqueParentFunctions.includes("all_functions")) {
          parentFunctionOptions.unshift({
            id: "all_functions",
            name: "all_functions",
          });
        }

        setParentFunctions(parentFunctionOptions);
      } catch (error) {
        console.error("Error fetching parent functions:", error);
        toast.error("Failed to fetch parent functions");
        setParentFunctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParentFunctions();
  }, [baseURL]);

  // Input Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  // Form Validation
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      toast.error("Name is required");
      isValid = false;
    }

    if (!formData.action_name.trim()) {
      newErrors.action_name = "Action name is required";
      toast.error("Action name is required");
      isValid = false;
    }

    if (!formData.parent_function) {
      newErrors.parent_function = "Parent function is required";
      toast.error("Parent function is required");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        lock_function: {
          name: formData.name,
          action_name: formData.action_name,
          parent_function: formData.parent_function,
          active: formData.active,
          module_id: "1",
        },
      };

      await axios.post(`${baseURL}/lock_functions.json`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Lock function created successfully");
      navigate("/setup-member/lock-function-list");
    } catch (error) {
      console.error("Error creating lock function:", error);
      toast.error(`Error creating lock function: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (value) => {
    let actionName = "";

    if (value === "Project") actionName = "project";
    else if (value === "Banner") actionName = "banner";
    else if (value === "Testimonial") actionName = "testimonial";
    else if (value === "Referral") actionName = "referral";
    else if (value === "Enquiry") actionName = "enquiry";
    else if (value === "Event") actionName = "event";
    else if (value === "Specification") actionName = "specification";
    else if (value === "Site Visit") actionName = "site_visit";
    else if (value === "Organization") actionName = "organization";
    else if (value === "Company") actionName = "company";
    else if (value === "Department") actionName = "department";
    else if (value === "Site") actionName = "site";
    else if (value === "Support Service") actionName = "support_service";
    else if (value === "Press Releases") actionName = "press_releases";
    else if (value === "FAQ") actionName = "faq";
    else if (value === "Referral Program") actionName = "referral_program";
    else if (value === "User Role") actionName = "user_role";
    else if (value === "Lock Function") actionName = "lock_function";
    else if (value === "User Module") actionName = "user_module";
    else if (value === "Property Type") actionName = "property_type";
    else if (value === "Project Building") actionName = "project_building";
    else if (value === "Construction") actionName = "construction";
    else if (value === "Project Config") actionName = "project_config";
    else if (value === "Amenities") actionName = "amenities";
    else if (value === "Visit Slot") actionName = "visit_slot";
    else if (value === "TDS Tutorials") actionName = "tds_tutorials";
    else if (value === "Plus Services") actionName = "plus_services";
    else if (value === "SMTP Settings") actionName = "smtp_settings";
    else if (value === "FAQ Category") actionName = "faq_category";
    else if (value === "FAQ SubCategory") actionName = "faq_subcategory";
    else if (value === "Construction Update") actionName = "construction_update";
    else if (value === "User Groups") actionName = "user_groups";
    else if (value === "Service Category") actionName = "service_category";
    else if (value === "Image Config") actionName = "image_config";
    else if (value === "Bank Details") actionName = "bank_details";
    else if (value === "Home Loan") actionName = "home_loan";
    else if (value === "Banks") actionName = "banks";
    else if (value === "Loan Manager") actionName = "loan_manager";
    else if (value === "Common Files") actionName = "common_files";
    else if (value === "Demand Notes") actionName = "demand_notes";
    else if (value === "Orders") actionName = "orders";
    else if (value === "Encash") actionName = "encash";
    else if (value === "Lock Payments") actionName = "lock_payments";
    else if (value === "Loyalty Members") actionName = "loyalty_members";
    else if (value === "Loyalty Tiers") actionName = "loyalty_tiers";
    else if (value === "Loyalty Section") actionName = "loyalty_section";
    else if (value === "Referral List") actionName = "referral_list";
    else if (value === "Rule Engine") actionName = "rule_engine";
    else if (value === "Loyalty Manager" || value === "Loyalty Managers") actionName = "loyalty_manager";
    else if (value === "Home Loan Request") actionName = "home_loan_request";

    setFormData({
      ...formData,
      name: value,
      action_name: actionName,
    });

    setShowActionName(false); // Hide Action Name field
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button 
            onClick={handleGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Setup Member</span>
          <span>{">"}</span>
          <span>Lock Function</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create Lock Function</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE LOCK FUNCTION</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Lock size={16} color="#C72030" />
              </span>
              Function Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Name Selection */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
                required
                error={!!errors.name}
              >
                <InputLabel shrink>Name</InputLabel>
                <MuiSelect
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  label="Name"
                  notched
                  displayEmpty
                  disabled={submitting}
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value="Project">Project</MenuItem>
                  <MenuItem value="Banner">Banner</MenuItem>
                  <MenuItem value="Testimonial">Testimonial</MenuItem>
                  <MenuItem value="Referral">Referral</MenuItem>
                  <MenuItem value="Enquiry">Enquiry</MenuItem>
                  <MenuItem value="Event">Event</MenuItem>
                  <MenuItem value="Specification">Specification</MenuItem>
                  <MenuItem value="Site Visit">Site Visit</MenuItem>
                  <MenuItem value="Organization">Organization</MenuItem>
                  <MenuItem value="Company">Company</MenuItem>
                  <MenuItem value="Department">Department</MenuItem>
                  <MenuItem value="Site">Site</MenuItem>
                  <MenuItem value="Support Service">Support Service</MenuItem>
                  <MenuItem value="Press Releases">Press Releases</MenuItem>
                  <MenuItem value="FAQ">FAQ</MenuItem>
                  <MenuItem value="Referral Program">Referral Program</MenuItem>
                  <MenuItem value="User Role">User Role</MenuItem>
                  <MenuItem value="Lock Function">Lock Function</MenuItem>
                  <MenuItem value="User Module">User Module</MenuItem>
                  <MenuItem value="User Groups">User Groups</MenuItem>
                  <MenuItem value="Property Type">Property Type</MenuItem>
                  <MenuItem value="Project Building">Project Building</MenuItem>
                  <MenuItem value="Construction">Construction</MenuItem>
                  <MenuItem value="Construction Update">Construction Update</MenuItem>
                  <MenuItem value="Project Config">Project Config</MenuItem>
                  <MenuItem value="Amenities">Amenities</MenuItem>
                  <MenuItem value="Visit Slot">Visit Slot</MenuItem>
                  <MenuItem value="TDS Tutorials">TDS Tutorials</MenuItem>
                  <MenuItem value="Plus Services">Plus Services</MenuItem>
                  <MenuItem value="SMTP Settings">SMTP Settings</MenuItem>
                  <MenuItem value="FAQ Category">FAQ Category</MenuItem>
                  <MenuItem value="FAQ SubCategory">FAQ SubCategory</MenuItem>
                  <MenuItem value="Service Category">Service Category</MenuItem>
                  <MenuItem value="Image Config">Image Config</MenuItem>
                  <MenuItem value="Bank Details">Bank Details</MenuItem>
                  <MenuItem value="Home Loan">Home Loan</MenuItem>
                  <MenuItem value="Banks">Banks</MenuItem>
                  <MenuItem value="Loan Manager">Loan Manager</MenuItem>
                  <MenuItem value="Common Files">Common Files</MenuItem>
                  <MenuItem value="Demand Notes">Demand Notes</MenuItem>
                  <MenuItem value="Orders">Orders</MenuItem>
                  <MenuItem value="Encash">Encash</MenuItem>
                  <MenuItem value="Lock Payments">Lock Payments</MenuItem>
                  <MenuItem value="Loyalty Members">Loyalty Members</MenuItem>
                  <MenuItem value="Loyalty Tiers">Loyalty Tiers</MenuItem>
                  <MenuItem value="Loyalty Section">Loyalty Section</MenuItem>
                  <MenuItem value="Referral List">Referral List</MenuItem>
                  <MenuItem value="Rule Engine">Rule Engine</MenuItem>
                  <MenuItem value="Loyalty Managers">Loyalty Managers</MenuItem>
                  <MenuItem value="Home Loan Request">Home Loan Request</MenuItem>
                </MuiSelect>
                {errors.name && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                    {errors.name}
                  </span>
                )}
              </FormControl>

              {/* Action Name (auto-filled, read-only) */}
              <TextField
                label="Action Name"
                name="action_name"
                value={formData.action_name}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ 
                  sx: { ...fieldStyles, backgroundColor: '#f9fafb' },
                  readOnly: true
                }}
                required
                error={!!errors.action_name}
                helperText={errors.action_name}
              />

              {/* Parent Function */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
                required
                error={!!errors.parent_function}
              >
                <InputLabel shrink>Parent Function</InputLabel>
                <MuiSelect
                  value={formData.parent_function}
                  onChange={(e) => setFormData({ ...formData, parent_function: e.target.value })}
                  label="Parent Function"
                  notched
                  displayEmpty
                  disabled={submitting}
                >
                  <MenuItem value="All Functions">All Functions</MenuItem>
                </MuiSelect>
                {errors.parent_function && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                    {errors.parent_function}
                  </span>
                )}
              </FormControl>

              {/* Active Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    name="active"
                    id="isActive"
                    checked={formData.active === 1}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-4 h-4 text-[#c72030] bg-gray-100 border-gray-300 rounded focus:ring-[#c72030] focus:ring-2"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="submit"
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2"
            disabled={submitting || loading}
          >
            {submitting ? "Creating..." : "Create Function"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LockFunctionCreate;
