import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const baseURL = API_CONFIG.BASE_URL;


const DepartmentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [company, setCompany] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    organizationId: "",
    companyId: "",
    siteId: null,
    active: true,
    deleted: false,
  });

  // Fetch Department Data by ID
  const fetchDepartment = async () => {
    try {
      const response = await axios.get(
        `${baseURL}departments/${id}.json`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      
      console.log("Department data:", response.data);
      
      if (response.data) {
        setFormData({
          name: response.data.name,
          organizationId: response.data.organization_id,
          companyId: response.data.company_id,
          siteId: response.data.site_id,
          active: response.data.active || true,
          deleted: response.data.deleted || false,
        });
      }
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error("Failed to fetch department data");
      navigate("/setup-member/department-list");
    }
  };

  // Fetch Organizations
  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(
        `${baseURL}organizations.json`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      
      if (Array.isArray(response.data.organizations)) {
        setOrganizations(response.data.organizations);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    }
  };

  // Fetch Companies
  const fetchCompanies = async () => {
    try {
      const response = await axios.get(
        `${baseURL}company_setups.json`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      
      if (Array.isArray(response.data.company_setups)) {
        setCompany(response.data.company_setups);
      } else {
        setCompany([]);
      }
    } catch (error) {
      console.error("Error fetching company setups:", error);
      toast.error("Failed to fetch company setups");
    }
  };

  // Load all data on component mount
  useEffect(() => {
    fetchDepartment();
    fetchOrganizations();
    fetchCompanies();
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
    setLoading(true);

    try {
      const departmentData = {
        department: {
          name: formData.name,
          organization_id: formData.organizationId,
          company_id: formData.companyId,
          site_id: formData.siteId || null,
          active: formData.active,
          deleted: formData.deleted
        }
      };

      const response = await axios.put(
        `${baseURL}departments/${id}.json`,
        departmentData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Update response:", response);
      toast.success("Department updated successfully!");
      navigate("/setup-member/department-list");
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error(error.response?.data?.message || "Failed to update department.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030]"></div>
      </div>
    );
  }

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
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT DEPARTMENT</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Building size={16} color="#C72030" />
              </span>
              Department Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <TextField
                label="Department Name"
                name="name"
                placeholder="Enter department name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                required
              />

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Company *</InputLabel>
                <MuiSelect
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  label="Company *"
                  notched
                  sx={fieldStyles}
                >
                  {company.map((comp) => (
                    <MenuItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Organization *</InputLabel>
                <MuiSelect
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  label="Organization *"
                  notched
                  sx={fieldStyles}
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="submit"
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Department"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentEdit;