import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_CONFIG } from "@/config/apiConfig";

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

const UserCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    mobile: "",
    email: "",
    password: "",
    role_id: "",
    company_id: "",
    department_id: "",
    country_code: "91",
    alternate_email1: "",
    alternate_email2: "",
    alternate_address: "",
    is_admin: false,
    employee_type: "",
    organization_id: "",
    user_title: "",
    gender: "",
    birth_date: "",
    blood_group: "",
    site_id: "",
  });

  // Fetch roles, companies, organizations, and departments when component mounts
  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
    fetchCompanies();
    fetchDepartments();
    fetchSites();
  }, []);

  // Fetch roles from API
  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await axios.get(`${baseURL}lock_roles.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        console.error("Invalid roles data format:", response.data);
        toast.error("Failed to load roles: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles. Please try again later.");
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    setOrganizationsLoading(true);
    try {
      const response = await axios.get(`${baseURL}organizations.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (
        response.data &&
        response.data.organizations &&
        Array.isArray(response.data.organizations)
      ) {
        setOrganizations(response.data.organizations);
      } else {
        console.error("Invalid organizations data format:", response.data);
        toast.error("Failed to load organizations: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations. Please try again later.");
    } finally {
      setOrganizationsLoading(false);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const response = await axios.get(`${baseURL}company_setups.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.data && Array.isArray(response.data.company_setups)) {
        setCompanies(response.data.company_setups);
      } else {
        console.error("Invalid companies data format:", response.data);
        toast.error("Failed to load companies: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies. Please try again later.");
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const response = await axios.get(`${baseURL}departments.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data && Array.isArray(response.data.departments)) {
        setDepartments(response.data.departments);
      } else {
        console.error("Invalid department data format:", response.data);
        toast.error("Failed to load departments: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments. Please try again later.");
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchSites = async () => {
    setSitesLoading(true);
    try {
      const response = await axios.get(`${baseURL}sites.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setSites(response.data);
      } else if (response.data && Array.isArray(response.data.sites)) {
        setSites(response.data.sites);
      } else {
        console.error("Invalid sites data format:", response.data);
        toast.error("Failed to load sites: Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast.error("Failed to load sites. Please try again later.");
    } finally {
      setSitesLoading(false);
    }
  };

  const getMaxBirthDate = () => {
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate()
    );
    return maxDate.toISOString().split("T")[0];
  };

  // Validate form data
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    const requiredFields = [
      { field: "firstname", label: "First Name" },
      { field: "lastname", label: "Last Name" },
      { field: "mobile", label: "Mobile Number" },
      { field: "email", label: "Email" },
      { field: "password", label: "Password" },
      { field: "role_id", label: "Role" },
      { field: "company_id", label: "Company" },
      { field: "department_id", label: "Department" },
    ];

    let emptyFields = requiredFields.filter(
      ({ field }) => !formData[field] || String(formData[field]).trim() === ""
    );

    if (emptyFields.length === requiredFields.length) {
      toast.dismiss();
      toast.error("Please fill in all the required fields.");
      return false;
    }

    for (const { field, label } of requiredFields) {
      if (!formData[field] || String(formData[field]).trim() === "") {
        newErrors[field] = `${label} is mandatory`;
        setErrors(newErrors);
        toast.dismiss();
        toast.error(`${label} is mandatory`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
      toast.error("Please enter a valid email address");
    }

    if (
      formData.alternate_email1 &&
      !emailRegex.test(formData.alternate_email1)
    ) {
      newErrors.alternate_email1 =
        "Please enter a valid alternate email address";
      isValid = false;
      toast.error("Please enter a valid alternate email address 1");
    }

    // Mobile validation
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number should be 10 digits";
      isValid = false;
      toast.error("Mobile number should be 10 digits");
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
      isValid = false;
      toast.error("Password must be at least 6 characters long");
    }

    // Birth date validation
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const minDate = new Date(
        today.getFullYear() - 16,
        today.getMonth(),
        today.getDate()
      );

      if (birthDate > minDate) {
        newErrors.birth_date = "User must be at least 16 years old";
        isValid = false;
        toast.error("User must be at least 16 years old");
      }
    }

    setErrors(newErrors);
    return isValid && Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    toast.dismiss();
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("user[organization_id]", formData.organization_id);
    data.append("user[company_id]", formData.company_id);
    data.append("user[role_id]", formData.role_id);
    data.append("user[firstname]", formData.firstname);
    data.append("user[lastname]", formData.lastname);
    data.append("user[mobile]", formData.mobile);
    data.append("user[email]", formData.email);
    data.append("user[password]", formData.password);
    data.append("user[alternate_email1]", formData.alternate_email1 || "");
    data.append("user[alternate_address]", formData.alternate_address || "");
    data.append("user[employee_type]", formData.employee_type || "");
    data.append("user[user_title]", formData.user_title || "");
    data.append("user[gender]", formData.gender || "");
    
    if (formData.birth_date) {
      const [year, month, day] = formData.birth_date.split("-");
      data.append("user[birth_date]", `${day}-${month}-${year}`);
    }
    
    data.append("user[site_id]", formData.site_id || "");
    data.append("user[department_id]", formData.department_id);

    try {
      const response = await axios.post(`${baseURL}users.json`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      toast.success("User created successfully");
      console.log("Response from API:", response.data);
      navigate("/setup-member/user-list");
    } catch (error) {
      console.error("Error creating user:", error);

      if (error.response?.status === 422) {
        const message =
          error.response.data?.message ||
          error.response.data?.errors?.[0] ||
          "Validation error. Please check the form.";
        toast.error(`Validation Error: ${message}`);
      } else {
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(`Error creating user: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
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
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create New User</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE NEW USER</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-[#F2F1EF]">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <User size={16} color="#C72030" />
              </span>
              User Details
            </h2>
        </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Row 1 */}
              <TextField
                label="First Name"
                placeholder="Enter firstname"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                required
                error={!!errors.firstname}
                helperText={errors.firstname}
              />
              <TextField
                label="Last Name"
                placeholder="Enter lastname"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                required
                error={!!errors.lastname}
                helperText={errors.lastname}
              />
              <TextField
                label="Mobile Number"
                placeholder="Enter mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                inputProps={{ maxLength: 10 }}
                required
                error={!!errors.mobile}
                helperText={errors.mobile}
              />

              {/* Row 2 */}
              <TextField
                label="Password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                type="password"
                required
                error={!!errors.password}
                helperText={errors.password}
              />
              <TextField
                label="Alternate Email"
                placeholder="Enter alternate email"
                value={formData.alternate_email1}
                onChange={(e) => setFormData({ ...formData, alternate_email1: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                type="email"
                error={!!errors.alternate_email1}
                helperText={errors.alternate_email1}
              />
              <TextField
                label="Address"
                placeholder="Enter alternate address"
                value={formData.alternate_address}
                onChange={(e) => setFormData({ ...formData, alternate_address: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Row 3 */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Gender</InputLabel>
                <MuiSelect
                  value={formData.gender || ""}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  label="Gender"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </MuiSelect>
              </FormControl>
              <TextField
                label="Birth Date"
                type="date"
                value={formData.birth_date || ""}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                inputProps={{ max: getMaxBirthDate() }}
                error={!!errors.birth_date}
                helperText={errors.birth_date}
              />
              <TextField
                label="Employee Type"
                placeholder="Enter employee type"
                value={formData.employee_type}
                onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Row 4 */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Organization</InputLabel>
                <MuiSelect
                  value={formData.organization_id || ""}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                  label="Organization"
                  notched
                  displayEmpty
                  disabled={organizationsLoading}
                >
                  <MenuItem value="">Select...</MenuItem>
                  {organizationsLoading ? (
                    <MenuItem disabled>Loading organizations...</MenuItem>
                  ) : organizations.length === 0 ? (
                    <MenuItem disabled>No organizations available</MenuItem>
                  ) : (
                    organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
              </FormControl>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
                required
                error={!!errors.role_id}
              >
                <InputLabel shrink>User Role</InputLabel>
                <MuiSelect
                  value={formData.role_id || ""}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  label="User Role"
                  notched
                  displayEmpty
                  disabled={rolesLoading}
                >
                  <MenuItem value="">Select...</MenuItem>
                  {rolesLoading ? (
                    <MenuItem disabled>Loading roles...</MenuItem>
                  ) : roles.length === 0 ? (
                    <MenuItem disabled>No roles available</MenuItem>
                  ) : (
                    roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
                {errors.role_id && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                    {errors.role_id}
                  </span>
                )}
              </FormControl>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
                required
                error={!!errors.department_id}
              >
                <InputLabel shrink>Department</InputLabel>
                <MuiSelect
                  value={formData.department_id || ""}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  label="Department"
                  notched
                  displayEmpty
                  disabled={departmentsLoading}
                >
                  <MenuItem value="">Select...</MenuItem>
                  {departmentsLoading ? (
                    <MenuItem disabled>Loading departments...</MenuItem>
                  ) : departments.length === 0 ? (
                    <MenuItem disabled>No departments available</MenuItem>
                  ) : (
                    departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
                {errors.department_id && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                    {errors.department_id}
                  </span>
                )}
              </FormControl>

              {/* Row 5 - Email, User Title, Company, Site */}
              <TextField
                label="Email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                type="email"
                required
                error={!!errors.email}
                helperText={errors.email}
              />
              <TextField
                label="User Title"
                placeholder="Enter user title"
                value={formData.user_title}
                onChange={(e) => setFormData({ ...formData, user_title: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
                required
                error={!!errors.company_id}
              >
                <InputLabel shrink>Company</InputLabel>
                <MuiSelect
                  value={formData.company_id || ""}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  label="Company"
                  notched
                  displayEmpty
                  disabled={companiesLoading}
                >
                  <MenuItem value="">Select...</MenuItem>
                  {companiesLoading ? (
                    <MenuItem disabled>Loading companies...</MenuItem>
                  ) : companies.length === 0 ? (
                    <MenuItem disabled>No companies available</MenuItem>
                  ) : (
                    companies.map((comp) => (
                      <MenuItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
                {errors.company_id && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                    {errors.company_id}
                  </span>
                )}
              </FormControl>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Site</InputLabel>
                <MuiSelect
                  value={formData.site_id || ""}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  label="Site"
                  notched
                  displayEmpty
                  disabled={sitesLoading}
                >
                  <MenuItem value="">Select...</MenuItem>
                  {sitesLoading ? (
                    <MenuItem disabled>Loading sites...</MenuItem>
                  ) : sites.length === 0 ? (
                    <MenuItem disabled>No sites available</MenuItem>
                  ) : (
                    sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))
                  )}
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
            {loading ? "Creating..." : "Create User"}
          </Button>
          <Button
            type="button"
            
            onClick={handleGoBack}
            className="border-[#E5E4E1] text-gray-700 hover:bg-[#ECEBE8] px-8 py-2"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;