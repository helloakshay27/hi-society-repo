import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { API_CONFIG } from "@/config/apiConfig";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { MaterialDatePicker } from "@/components/ui/material-date-picker";
import { ArrowLeft, User } from 'lucide-react';
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

const UserEdit = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const { id } = useParams(); // Get user ID from URL params
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [errors, setErrors] = useState({});

  // State for dropdown options
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]); // Added departments state
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false); // Added departments loading state

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

  console.log("Form Data:", formData);
  console.log("Departments:", departments); // Added debugging line for departments

  // Fetch dropdown data and user data when component mounts
  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
    fetchCompanies();
    fetchDepartments(); // Added department fetching
    fetchUserData();
    fetchSites();
  }, [id]);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setFetchingUser(true);
      const response = await axios.get(`${baseURL}/user_details/${id}.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      const userData =
        response.data.users ||
        response.data.data ||
        (Array.isArray(response.data) ? response.data[0] : response.data);

      if (!userData) {
        throw new Error("Invalid user data structure in API response");
      }

      //  if (userData?.birth_date) {
      //   try {
      //     const [day, month, year] = userData.birth_date.split("-");
      //     userData.birth_date = `${year}-${month.padStart(
      //       2,
      //       "0"
      //     )}-${day.padStart(2, "0")}`;
      //   } catch (error) {
      //     console.warn("Could not parse birth_date:", error);
      //     userData.birth_date = "";
      //   }
      // }

      if (response.data.birth_date) {
        const [day, month, year] = response.data.birth_date.split("-");
        if (day && month && year) {
          response.data.birth_date = `${year}-${month.padStart(
            2,
            "0"
          )}-${day.padStart(2, "0")}`;
        }
      }

      console.log(response.data);
      setFormData({
        organization_id: response.data.organization_id,
        company_id: response.data.company_id,
        role_id: response.data.role_id,
        firstname: response.data.firstname,
        lastname: response.data.lastname,
        mobile: response.data.mobile,
        email: response.data.email,
        password: response.data.password || "********", // Display masked password
        alternate_email1: response.data.alternate_email1,
        alternate_email2: response.data.alternate_email2,
        alternate_address: response.data.alternate_address,
        is_admin: response.data.is_admin,
        employee_type: response.data.employee_type,
        user_title: response.data.user,
        gender: response.data.gender,
        birth_date: response.data.birth_date,
        blood_group: response.data.blood_group,
        site_id: response.data.site_id,
        department_id: response.data.department_id,
        country_code: response.data.country_code,
      });

      setFormData(userData);

      setFetchingUser(false);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error(
        `Failed to fetch user details: ${
          error.response?.data?.message || error.message
        }`
      );
      setFetchingUser(false);
    }
  };

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

      console.log("Department API response:", response.data); // Debug the API response

      // Check if response.data is directly an array
      if (response.data && Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data && Array.isArray(response.data.departments)) {
        // Fallback to original expected structure
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

      console.log("Sites API response:", response.data); // Debug the API response

      // Check if response.data is directly an array
      if (response.data && Array.isArray(response.data)) {
        setSites(response.data);
      } else if (response.data && Array.isArray(response.data.sites)) {
        // Fallback to original expected structure
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

  const handleChange = (e) => {
    if (!e || !e.target) return; // Prevents the crash

    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const getMaxBirthDate = () => {
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate()
    );
    return maxDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // Update your validateForm function to include birth date validation
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    const requiredFields = [
      { field: "firstname", label: "First Name" },
      { field: "lastname", label: "Last Name" },
      { field: "mobile", label: "Mobile Number" },
      { field: "email", label: "Email" },
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

    // Birth date validation - must be at least 16 years old
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

    if (
      formData.alternate_email2 &&
      !emailRegex.test(formData.alternate_email2)
    ) {
      newErrors.alternate_email2 =
        "Please enter a valid alternate email address";
      isValid = false;
      toast.error("Please enter a valid alternate email address 2");
    }

    // Mobile validation - should be 10 digits
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number should be 10 digits";
      isValid = false;
      toast.error("Mobile number should be 10 digits");
    }

    setErrors(newErrors);
    return isValid && Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    //  let formattedData = { ...formData };
    // if (formData?.birth_date) {
    //   const [year, month, day] = formData.birth_date.split("-");
    //   formattedData.birth_date = `${day}-${month}-${year}`;
    // }

    // Create user object from form data
    const data = new FormData();
    data.append("user[organization_id]", formData.organization_id);
    data.append("user[company_id]", formData.company_id);
    data.append("user[role_id]", formData.role_id);
    data.append("user[firstname]", formData.firstname);
    data.append("user[lastname]", formData.lastname);
    data.append("user[mobile]", formData.mobile);
    data.append("user[email]", formData.email);
    data.append("user[alternate_email1]", formData.alternate_email1);
    data.append("user[alternate_address]", formData.alternate_address);
    data.append("user[employee_type]", formData.employee_type);
    data.append("user[user_title]", formData.user_title);
    data.append("user[gender]", formData.gender);

    //  data.append("user[birth_date]", formData.birth_date);

    // Format birth date properly for API (DD-MM-YYYY)
    if (formData.birth_date) {
      const [year, month, day] = formData.birth_date.split("-");
      data.append("user[birth_date]", `${day}-${month}-${year}`);
    }

    data.append("user[site_id]", formData.site_id);
    data.append("user[department_id]", formData.department_id);

    try {
      const response = await axios.put(`${baseURL}users/${id}.json`, data, {
        headers: {
          "Content-Type": "multipart/form-data", // Changed to multipart/form-data for FormData
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      toast.success("User updated successfully");
      console.log("Response from API:", response.data);
      navigate("/setup-member/user-list");
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(`Error updating user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (formData?.birth_date) {
    const [day, month, year] = formData.birth_date.split("-");

    if (day && month && year) {
      formData.birth_date = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
    }
  } else {
    //FallBack
    console.warn("birth_date is null or undefined");
  }

  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  if (formData.birth_date) {
    const [day, month, year] = formData.birth_date.split("-");
    if (day && month && year) {
      formData.birth_date = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
    }
  }

  // Prepare dropdown options
  const roleOptions = [
    { label: "Select Role", value: "" },
    ...roles.map((role) => ({
      label: role.name || `Role ${role.id}`,
      value: role.id.toString(),
    })),
  ];

  const organizationOptions = [
    { label: "Select Organization", value: "" },
    ...organizations.map((org) => ({
      label: org.name || `Organization ${org.id}`,
      value: org.id.toString(),
    })),
  ];

  const companyOptions = [
    { label: "Select Company", value: "" },
    ...companies.map((company) => ({
      label: company.name || `Company ${company.id}`,
      value: company.id.toString(),
    })),
  ];

  // Added department options
  const departmentOptions = [
    { label: "Select Department", value: "" },
    ...departments.map((dept) => ({
      label: dept.name || `Department ${dept.id}`,
      value: dept.id.toString(),
    })),
  ];

  const siteoptions = [
    ...sites.map((site) => ({
      label: site.name || `Department ${site.id}`,
      value: site.id.toString(),
    })),
  ];

  if (fetchingUser) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Setup Member</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit User</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT USER</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <User size={16} color="#C72030" />
              </span>
              User Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* First Name */}
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

              {/* Last Name */}
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

              {/* Mobile Number */}
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

              {/* Email */}
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

              {/* Password - Read Only */}
              <TextField
                label="Password"
                placeholder="Password"
                value={formData.password}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ 
                  sx: { 
                    ...fieldStyles,
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed'
                  },
                  readOnly: true
                }}
                type="password"
                disabled
              />

              {/* Alternate Email */}
              <TextField
                label="Alternate Email"
                placeholder="Enter alternate email"
                value={formData.alternate_email1 || ""}
                onChange={(e) => setFormData({ ...formData, alternate_email1: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                type="email"
                error={!!errors.alternate_email1}
                helperText={errors.alternate_email1}
              />

              {/* Address */}
              <TextField
                label="Address"
                placeholder="Enter address"
                value={formData.alternate_address || ""}
                onChange={(e) => setFormData({ ...formData, alternate_address: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* User Title */}
              <TextField
                label="User Title"
                placeholder="Enter user title"
                value={formData.user_title || ""}
                onChange={(e) => setFormData({ ...formData, user_title: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Gender */}
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

              {/* Birth Date */}
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

              {/* Employee Type */}
              <TextField
                label="Employee Type"
                placeholder="Enter employee type"
                value={formData.employee_type || ""}
                onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Company */}
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
                >
                  <MenuItem value="">Select...</MenuItem>
                  {companies.map((comp) => (
                    <MenuItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Organization */}
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
                >
                  <MenuItem value="">Select...</MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* User Role */}
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
                >
                  <MenuItem value="">Select...</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Department */}
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
                >
                  <MenuItem value="">Select...</MenuItem>
                  {departmentsLoading ? (
                    <MenuItem value="" disabled>Loading...</MenuItem>
                  ) : departments.length > 0 ? (
                    departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>No departments found</MenuItem>
                  )}
                </MuiSelect>
              </FormControl>

              {/* Site */}
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
                >
                  <MenuItem value="">Select...</MenuItem>
                  {sitesLoading ? (
                    <MenuItem value="" disabled>Loading...</MenuItem>
                  ) : sites.length > 0 ? (
                    sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>No sites found</MenuItem>
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
            {loading ? "Updating..." : "Update User"}
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
      </form>
    </div>
  );
};

export default UserEdit;
