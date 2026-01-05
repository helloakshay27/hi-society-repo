import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { ArrowLeft, Building } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
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

const DepartmentCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    organizationId: "",
    companyId: "",
    siteId: null,
    active: true,
    deleted: false,
  });

  const [errors, setErrors] = useState({});

  // Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/organizations.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const data = await response.json();
        setOrganizations(Array.isArray(data.organizations) ? data.organizations : []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Failed to fetch organizations.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [baseURL]);

  // Fetch Companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${baseURL}/company_setups.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const data = await response.json();
        setCompanies(Array.isArray(data.company_setups) ? data.company_setups : []);
      } catch (error) {
        console.error("Error fetching company setups:", error);
        toast.error("Failed to fetch company setups.");
      }
    };

    fetchCompanies();
  }, [baseURL]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Department name is required";
    if (!formData.organizationId) newErrors.organizationId = "Organization is required";
    if (!formData.companyId) newErrors.companyId = "Company is required";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${baseURL}/departments.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department: {
            name: formData.name,
            organization_id: formData.organizationId,
            company_id: formData.companyId,
            site_id: formData.siteId || null,
            active: true,
            deleted: false,
          },
        }),
      });

      if (response.ok) {
        toast.success("Department created successfully!");
        navigate("/setup-member/department-list");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create department.");
      }
    } catch (error) {
      console.error("Error submitting department:", error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
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
          <span>{">"}  </span>
          <span>Department</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE DEPARTMENT</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b bg-[#F6F4EE]">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Building size={16} color="#C72030" />
              </span>
              Department Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField
                label="Department Name"
                placeholder="Enter department name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                error={!!errors.name}
                helperText={errors.name}
                required
              />

              <FormControl fullWidth variant="outlined" error={!!errors.companyId}>
                <InputLabel shrink>Company *</InputLabel>
                <MuiSelect
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  label="Company *"
                  notched
                  sx={fieldStyles}
                >
                  {loading ? (
                    <MenuItem value="">Loading...</MenuItem>
                  ) : companies.length > 0 ? (
                    companies.map((comp) => (
                      <MenuItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No companies found</MenuItem>
                  )}
                </MuiSelect>
                {errors.companyId && (
                  <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>
                )}
              </FormControl>

              <FormControl fullWidth variant="outlined" error={!!errors.organizationId}>
                <InputLabel shrink>Organization *</InputLabel>
                <MuiSelect
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  label="Organization *"
                  notched
                  sx={fieldStyles}
                >
                  {loading ? (
                    <MenuItem value="">Loading...</MenuItem>
                  ) : organizations.length > 0 ? (
                    organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No organizations found</MenuItem>
                  )}
                </MuiSelect>
                {errors.organizationId && (
                  <p className="text-red-500 text-xs mt-1">{errors.organizationId}</p>
                )}
              </FormControl>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="submit"
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Submit"}
          </Button>
          <Button
            type="button"
            
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

export default DepartmentCreate;
