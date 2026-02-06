import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Camera, User as UserIcon, Info } from "lucide-react";
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button as MuiButton,
  InputAdornment,
  IconButton,
  styled,
  FormLabel,
  Avatar,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { getFullUrl } from "@/config/apiConfig";

// Styled Components
const SectionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  borderRadius: 0,
  overflow: 'hidden',
  marginBottom: '24px',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 24px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
}));

const RedIcon = styled(Box)(({ theme }) => ({
  color: 'white',
  backgroundColor: '#C72030',
  borderRadius: '50%',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
}));

const RedButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: '#E7E3D9',
  color: '#C72030',
  borderRadius: 0,
  textTransform: 'none',
  padding: '8px 16px',
  fontFamily: 'Work Sans, sans-serif',
  fontWeight: 500,
  boxShadow: 'none',
}));

const DraftButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: '#e7e3d9',
  color: '#C72030',
  borderRadius: 0,
  textTransform: 'none',
  padding: '8px 16px',
  fontFamily: 'Work Sans, sans-serif',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#d9d5c9',
  },
}));

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    fontSize: '14px',
    backgroundColor: '#fff',
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
    fontSize: '14px',
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 128,
  height: 128,
  backgroundColor: '#fff', // white background
  fontSize: '48px',
  color: '#C72030', // icon color matches SVG color
  border: '2px solid #C72030',
}));

const CameraButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: '#C72030',
  color: 'white',
  width: '32px',
  height: '32px',
  '&:hover': {
    backgroundColor: '#a01828',
  },
}));

const getCreateApiUrl = () => {
  const token = localStorage.getItem('token') || '';
  return getFullUrl(`/crm/admin/user_societies.json?token=${token}`);
};

const getEditApiUrl = (id: string) => {
  const token = localStorage.getItem('token') || '';
  return getFullUrl(`/crm/admin/user_societies/${id}.json?token=${token}`);
};

const mapFormDataToApiPayload = (formData: any) => ({
  email: formData.email,
  number: formData.mobile,
  password: formData.password,
  user_title: formData.title,
  firstname: formData.firstName,
  lastname: formData.lastName,
  country_code: formData.countryCode,
  country_code_name: "IN",
  alternate_email1: formData.alternateEmail1,
  alternate_email2: formData.alternateEmail2,
  alternate_address: formData.alternateAddress,
  company_name: formData.companyName || "",
  pan_number: formData.panNumber,
  gst_number: formData.gstNumber,
  flat: formData.flat,
  ownership: formData.residentType,
  lives_here: formData.livesHere === "Yes" ? true : false,
  allow_fitout: formData.allowFitout === "Yes" ? true : false,
  intercom: formData.intercomNumber,
  landline: formData.landlineNumber,
  agreement_start_date: formData.agreementStartDate || "",
  agreement_expire_date: formData.agreementExpireDate || "",
  document: null,
  status: formData.status === "Active" || formData.status === true,
  is_primary: formData.membershipType === "Primary" ? 1 : 0,
  birthday: formData.birthDate,
  anniversary: formData.anniversary,
  spouse_birthday: formData.spouseBirthDate,
  differently_abled: formData.differentlyAbled === "Yes" ? true : false,
  ev_connection: formData.evConnection === "Yes" ? true : false,
  adults: Number(formData.noOfAdults) || 0,
  children: Number(formData.noOfChildren) || 0,
  pets: Number(formData.noOfPets) || 0,
  user_category_id: formData.category === "Resident" ? 3 : formData.category === "Staff" ? 2 : 1,
  name_on_bill: `${formData.firstName} ${formData.lastName}`,
});

const defaultFormData = {
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+91",
  mobile: "",
  password: "",
  phase: "",
  status: "",
  tower: "",
  flat: "",
  category: "",
  alternateAddress: "",
  residentType: "Owner",
  membershipType: "Primary",
  livesHere: "Yes",
  allowFitout: "No",
  birthDate: "",
  anniversary: "",
  spouseBirthDate: "",
  alternateEmail1: "",
  alternateEmail2: "",
  landlineNumber: "",
  intercomNumber: "",
  gstNumber: "",
  panNumber: "",
  evConnection: "",
  noOfPets: "",
  noOfAdults: "",
  noOfChildren: "",
  differentlyAbled: "No",
  companyName: "",
  agreementStartDate: "",
  agreementExpireDate: "",
};

export const AddUserPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const location = useLocation();
  const isEdit = Boolean(userId);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [towerOptions, setTowerOptions] = useState<{ id: number; name: string }[]>([]);
  const [flatOptions, setFlatOptions] = useState<{ id: number; flat_no: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get society_id from localStorage (set by header)
  const getSocietyId = () => {
    return localStorage.getItem('selectedUserSociety') || '';
  };

  // Fetch flats when tower changes
  const fetchFlats = async (blockId: number) => {
    try {
      const societyId = getSocietyId();
      const token = localStorage.getItem('token') || '';
      if (!societyId || !token) {
        setFlatOptions([]);
        return;
      }
      const url = getFullUrl(`/get_society_flats.json?token=${token}&society_id=${societyId}&society_block_id=${blockId}`);
      const res = await fetch(url);
      const data = await res.json();
      setFlatOptions(Array.isArray(data.society_flats) ? data.society_flats : []);
    } catch (e) {
      setFlatOptions([]);
    }
  };

  // Fetch user data if editing and fetch tower options always
  useEffect(() => {
    // Fetch towers (blocks)
    const fetchTowers = async () => {
      try {
        const societyId = getSocietyId();
        const token = localStorage.getItem('token') || '';
        if (!societyId || !token) {
          setTowerOptions([]);
          return;
        }
        const url = getFullUrl(`/get_society_blocks.json?token=${token}&society_id=${societyId}`);
        const res = await fetch(url);
        const data = await res.json();
        setTowerOptions(Array.isArray(data.society_blocks) ? data.society_blocks : []);
      } catch (e) {
        setTowerOptions([]);
      }
    };
    fetchTowers();

    if (isEdit && userId) {
      setLoading(true);
      fetch(getEditApiUrl(userId), { method: "GET" })
        .then(res => res.json())
        .then(data => {
          // Map API response to formData shape
          const user = data?.data || {};
          setFormData({
            ...defaultFormData,
            title: user.user_title || "",
            firstName: user.firstname || "",
            lastName: user.lastname || "",
            email: user.email || "",
            countryCode: user.country_code || "+91",
            mobile: user.number || "",
            password: "", // don't prefill password
            phase: user.phase || "",
            status: user.status ? "Active" : "Inactive",
            tower: user.tower || "",
            flat: user.flat || "",
            category: user.user_category_id === 3 ? "Resident" : user.user_category_id === 2 ? "Staff" : "Vendor",
            alternateAddress: user.alternate_address || "",
            residentType: user.ownership || "Owner",
            membershipType: user.is_primary === 1 ? "Primary" : "Secondary",
            livesHere: user.lives_here ? "Yes" : "No",
            allowFitout: user.allow_fitout ? "Yes" : "No",
            birthDate: user.birthday || "",
            anniversary: user.anniversary || "",
            spouseBirthDate: user.spouse_birthday || "",
            alternateEmail1: user.alternate_email1 || "",
            alternateEmail2: user.alternate_email2 || "",
            landlineNumber: user.landline || "",
            intercomNumber: user.intercom || "",
            gstNumber: user.gst_number || "",
            panNumber: user.pan_number || "",
            evConnection: user.ev_connection ? "Yes" : "No",
            noOfPets: user.pets?.toString() || "",
            noOfAdults: user.adults?.toString() || "",
            noOfChildren: user.children?.toString() || "",
            differentlyAbled: user.differently_abled ? "Yes" : "No",
            companyName: user.company_name || "",
            agreementStartDate: user.agreement_start_date || "",
            agreementExpireDate: user.agreement_expire_date || "",
          });
        })
        .catch(() => setError("Failed to load user data."))
        .finally(() => setLoading(false));
    }
  }, [isEdit, userId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.title) {
      return "Please select a title";
    }
    if (!formData.firstName.trim()) {
      return "First name is required";
    }
    if (!formData.lastName.trim()) {
      return "Last name is required";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }
    if (!formData.mobile.trim()) {
      return "Mobile number is required";
    }
    // Mobile number validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      return "Please enter a valid 10-digit mobile number";
    }
    if (!isEdit && !formData.password.trim()) {
      return "Password is required";
    }
    if (!isEdit && formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!formData.phase) {
      return "Please select a phase";
    }
    if (!formData.status) {
      return "Please select a status";
    }
    if (!formData.tower) {
      return "Please select a tower";
    }
    if (!formData.flat) {
      return "Please select a flat";
    }
    if (!formData.category) {
      return "Please select a category";
    }
    return null;
  };

  const handleSubmit = async () => {
    // Validate form before submission
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    const payload = mapFormDataToApiPayload(formData);
    try {
      const res = await fetch(isEdit && userId ? getEditApiUrl(userId) : getCreateApiUrl(), {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API error");
      // Optionally handle response
      navigate("/setup/manage-users");
    } catch (e) {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle image upload logic here
      console.log("Image uploaded:", file);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fafafa',
        padding: '24px',
        fontFamily: 'Work Sans, sans-serif',
      }}
    >
      <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Paper
          sx={{
            backgroundColor: 'white',
            borderRadius: 0,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '24px',
            padding: '16px 24px',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#1A1A1A',
              margin: 0,
              fontFamily: 'Work Sans, sans-serif',
            }}
          >
            {isEdit ? "Edit User" : "Add User"}
          </h1>
        </Paper>
        {error && (
          <Box sx={{ color: "#C72030", mb: 2, fontWeight: 500 }}>{error}</Box>
        )}
        {/* Primary Details Section */}
        <SectionCard>
          <SectionHeader>
            <RedIcon>
              <UserIcon size={16} />
            </RedIcon>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1A1A1A',
                margin: 0,
                fontFamily: 'Work Sans, sans-serif',
              }}
            >
              Primary Details
            </h2>
          </SectionHeader>

          <Box sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', gap: '24px' }}>
              {/* Profile Photo */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Box sx={{ position: 'relative' }}>
                  <ProfileAvatar>
                    <UserIcon size={64} />
                  </ProfileAvatar>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-upload"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="profile-upload" style={{ cursor: 'pointer' }}>
                    <CameraButton>
                      <Camera size={16} />
                    </CameraButton>
                  </label>
                </Box>
              </Box>

              {/* Form Fields */}
              <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: '16px' }}>
                {/* Title */}
                <FormControl fullWidth size="small" sx={fieldStyles}>
                  <InputLabel required>Select Title</InputLabel>
                  <Select
                    value={formData.title}
                    label="Select Title"
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  >
                    <MenuItem value="Mr">Mr</MenuItem>
                    <MenuItem value="Mrs">Mrs</MenuItem>
                    <MenuItem value="Ms">Ms</MenuItem>
                    <MenuItem value="Dr">Dr</MenuItem>
                  </Select>
                </FormControl>

                {/* First Name */}
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  sx={fieldStyles}
                />

                {/* Last Name */}
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  sx={fieldStyles}
                />

                {/* Email */}
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  sx={fieldStyles}
                />

                {/* Mobile */}
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  <FormControl size="small" sx={{ ...fieldStyles, width: '100px' }}>
                    <InputLabel>Code</InputLabel>
                    <Select
                      value={formData.countryCode}
                      label="Code"
                      onChange={(e) => handleInputChange("countryCode", e.target.value)}
                    >
                      <MenuItem value="+91">🇮🇳 +91</MenuItem>
                      <MenuItem value="+1">🇺🇸 +1</MenuItem>
                      <MenuItem value="+44">🇬🇧 +44</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mobile Number"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    sx={fieldStyles}
                  />
                </Box>

                {/* Password */}
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  sx={fieldStyles}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Phase */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Phase</InputLabel>
                  <Select
                    value={formData.phase}
                    label="Select Phase"
                    onChange={(e) => handleInputChange("phase", e.target.value)}
                  >
                    <MenuItem value="">Select Phase</MenuItem>
                    <MenuItem value="Pre Sales">Post Sales</MenuItem>
                    <MenuItem value="Post Sales">Post Possession</MenuItem>
                  </Select>
                </FormControl>

                {/* Status */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Select Status"
                    onChange={(e) => handleInputChange("status", e.target.value)}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                {/* Tower */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Tower</InputLabel>
                  <Select
                    value={formData.tower}
                    label="Select Tower"
                    onChange={(e) => {
                      const selectedTower = towerOptions.find(t => t.name === e.target.value);
                      handleInputChange("tower", e.target.value);
                      handleInputChange("flat", ""); // Reset flat when tower changes
                      if (selectedTower) {
                        fetchFlats(selectedTower.id);
                      } else {
                        setFlatOptions([]);
                      }
                    }}
                  >
                    <MenuItem value="">Select Tower</MenuItem>
                    {towerOptions.map((block) => (
                      <MenuItem key={block.id} value={block.name}>{block.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Flat */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Flat</InputLabel>
                  <Select
                    value={formData.flat}
                    label="Select Flat"
                    onChange={(e) => handleInputChange("flat", e.target.value)}
                  >
                    <MenuItem value="">Select Flat</MenuItem>
                    {flatOptions.map((flat) => (
                      <MenuItem key={flat.id} value={flat.flat_no}>{flat.flat_no}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Category */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Select Category"
                    onChange={(e) => handleInputChange("category", e.target.value)}
                  >
                    <MenuItem value="Resident">Resident</MenuItem>
                    <MenuItem value="Staff">Staff</MenuItem>
                    <MenuItem value="Vendor">Vendor</MenuItem>
                  </Select>
                </FormControl>

                {/* Alternate Address */}
                <div className="mb-8 mt-8 relative" style={{ gridColumn: 'span 3' }}>
                  <label className="absolute -top-3 left-3 bg-white px-2 text-sm text-[rgba(0, 0, 0, 0.6)]">
                    Alternate Address
                  </label>
                  <textarea
                    id="alternate-address"
                    value={formData.alternateAddress}
                    onChange={(e) => handleInputChange('alternateAddress', e.target.value)}
                    className="w-full px-4 py-3 border border-[#D5DbDB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent resize-vertical"
                    placeholder="Enter alternate address"
                    rows={3}
                  />
                </div>

                {/* Resident Type */}
                <FormControl component="fieldset" sx={{ gridColumn: { md: 'span 1' } }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      fontSize: '14px',
                      color: 'rgba(0, 0, 0, 0.6)',
                      marginBottom: '8px',
                      '&.Mui-focused': { color: '#C72030' },
                    }}
                  >
                    Resident Type:
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.residentType}
                    onChange={(e) => handleInputChange("residentType", e.target.value)}
                  >
                    <FormControlLabel value="Owner" control={<Radio size="small" />} label="Owner" />
                    <FormControlLabel value="Tenant" control={<Radio size="small" />} label="Tenant" />
                  </RadioGroup>
                </FormControl>

                {/* Membership Type */}
                <FormControl component="fieldset" sx={{ gridColumn: { md: 'span 1' } }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      fontSize: '14px',
                      color: 'rgba(0, 0, 0, 0.6)',
                      marginBottom: '8px',
                      '&.Mui-focused': { color: '#C72030' },
                    }}
                  >
                    Membership Type:
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.membershipType}
                    onChange={(e) => handleInputChange("membershipType", e.target.value)}
                  >
                    <FormControlLabel value="Primary" control={<Radio size="small" />} label="Primary" />
                    <FormControlLabel value="Secondary" control={<Radio size="small" />} label="Secondary" />
                  </RadioGroup>
                </FormControl>

                {/* Lives Here */}
                <FormControl component="fieldset" sx={{ gridColumn: { md: 'span 1' } }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      fontSize: '14px',
                      color: 'rgba(0, 0, 0, 0.6)',
                      marginBottom: '8px',
                      '&.Mui-focused': { color: '#C72030' },
                    }}
                  >
                    Lives Here:
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.livesHere}
                    onChange={(e) => handleInputChange("livesHere", e.target.value)}
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>

                {/* Allow Fitout */}
                <FormControl component="fieldset" sx={{ gridColumn: { md: 'span 1' } }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      fontSize: '14px',
                      color: 'rgba(0, 0, 0, 0.6)',
                      marginBottom: '8px',
                      '&.Mui-focused': { color: '#C72030' },
                    }}
                  >
                    Allow Fitout:
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.allowFitout}
                    onChange={(e) => handleInputChange("allowFitout", e.target.value)}
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </SectionCard>

        {/* Additional Info Section */}
        <SectionCard>
          <SectionHeader>
            <RedIcon>
              <Info size={16} />
            </RedIcon>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1A1A1A',
                margin: 0,
                fontFamily: 'Work Sans, sans-serif',
              }}
            >
              Additional Info
            </h2>
          </SectionHeader>

          <Box sx={{ padding: '24px' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: '16px' }}>
              {/* Birth Date */}
              <TextField
                fullWidth
                size="small"
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
              />

              {/* Anniversary */}
              <TextField
                fullWidth
                size="small"
                label="Anniversary"
                type="date"
                value={formData.anniversary}
                onChange={(e) => handleInputChange("anniversary", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
              />

              {/* Spouse Birth Date */}
              <TextField
                fullWidth
                size="small"
                label="Spouse Birth Date"
                type="date"
                value={formData.spouseBirthDate}
                onChange={(e) => handleInputChange("spouseBirthDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
              />

              {/* Alternate Email 1 */}
              <TextField
                fullWidth
                size="small"
                label="Alternate Email-1"
                type="email"
                value={formData.alternateEmail1}
                onChange={(e) => handleInputChange("alternateEmail1", e.target.value)}
                sx={fieldStyles}
              />

              {/* Alternate Email 2 */}
              <TextField
                fullWidth
                size="small"
                label="Alternate Email-2"
                type="email"
                value={formData.alternateEmail2}
                onChange={(e) => handleInputChange("alternateEmail2", e.target.value)}
                sx={fieldStyles}
              />

              {/* Landline Number */}
              <TextField
                fullWidth
                size="small"
                label="Landline Number"
                value={formData.landlineNumber}
                onChange={(e) => handleInputChange("landlineNumber", e.target.value)}
                sx={fieldStyles}
              />

              {/* Intercom Number */}
              <TextField
                fullWidth
                size="small"
                label="Intercom Number"
                value={formData.intercomNumber}
                onChange={(e) => handleInputChange("intercomNumber", e.target.value)}
                sx={fieldStyles}
              />

              {/* GST Number */}
              <TextField
                fullWidth
                size="small"
                label="Gst Number"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                sx={fieldStyles}
              />

              {/* PAN Number */}
              <TextField
                fullWidth
                size="small"
                label="Pan Number"
                value={formData.panNumber}
                onChange={(e) => handleInputChange("panNumber", e.target.value)}
                sx={fieldStyles}
              />

              {/* EV Connection */}
              <FormControl fullWidth size="small" sx={fieldStyles}>
                <InputLabel>EV Connection</InputLabel>
                <Select
                  value={formData.evConnection}
                  label="EV Connection"
                  onChange={(e) => handleInputChange("evConnection", e.target.value)}
                >
                  <MenuItem value="NA">NA</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>

              {/* No. of Adult Family Members Residing */}
              <TextField
                fullWidth
                size="small"
                label="No. of Adult Family Members Residing"
                type="number"
                value={formData.noOfAdults}
                onChange={(e) => handleInputChange("noOfAdults", e.target.value)}
                sx={fieldStyles}
              />

              {/* No. of Children Residing */}
              <TextField
                fullWidth
                size="small"
                label="No. of Children Residing"
                type="number"
                value={formData.noOfChildren}
                onChange={(e) => handleInputChange("noOfChildren", e.target.value)}
                sx={fieldStyles}
              />

              {/* No. of Pets */}
              <TextField
                fullWidth
                size="small"
                label="No. of Pets"
                type="number"
                value={formData.noOfPets}
                onChange={(e) => handleInputChange("noOfPets", e.target.value)}
                sx={fieldStyles}
              />

              {/* Differently Abled */}
              <FormControl component="fieldset">
                <FormLabel
                  component="legend"
                  sx={{
                    fontSize: '14px',
                    color: 'rgba(0, 0, 0, 0.6)',
                    marginBottom: '8px',
                    '&.Mui-focused': { color: '#C72030' },
                  }}
                >
                  Differently Abled:
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.differentlyAbled}
                  onChange={(e) => handleInputChange("differentlyAbled", e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
            </Box>
          </Box>

          {/* Submit Button */}
          <Box
            sx={{
              borderTop: '1px solid #e5e7eb',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <RedButton onClick={handleSubmit} disabled={loading}>
              {loading ? (isEdit ? "Saving..." : "Submitting...") : (isEdit ? "Save" : "Submit")}
            </RedButton>
            <DraftButton onClick={handleCancel} disabled={loading}>Cancel</DraftButton>
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
};

export default AddUserPage;
