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

<<<<<<< HEAD
// Floating Label Field Component
const FloatingLabelField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => {
  return (
    <div className="relative">
      <div className="border-2 border-gray-300 rounded px-3 py-2">
        <label className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
          {required && <span className="text-red-500">* </span>}
          {label}
        </label>
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AddUserPage = () => {
=======
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
  backgroundColor: '#C72030', // matches SVG color
  color: 'white',
  borderRadius: 0,
  textTransform: 'none',
  padding: '8px 16px',
  fontFamily: 'Work Sans, sans-serif',
  fontWeight: 500,
  boxShadow: '0 2px 4px rgba(199, 32, 48, 0.2)',
  '&:hover': {
    backgroundColor: '#B8252F',
    boxShadow: '0 4px 8px rgba(199, 32, 48, 0.3)',
  },
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

const API_TOKEN = "bfa5004e7b0175622be8f7e69b37d01290b737f82e078414";
const CREATE_API = `https://uat-hi-society.lockated.com/crm/admin/user_societies.json?token=${API_TOKEN}`;
const EDIT_API = (id: string) => `https://uat-hi-society.lockated.com/crm/admin/user_societies/${id}.json?token=${API_TOKEN}`;

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

const AddUserPage = () => {
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const location = useLocation();
  const isEdit = Boolean(userId);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data if editing
  useEffect(() => {
    if (isEdit && userId) {
      setLoading(true);
      fetch(EDIT_API(userId), { method: "GET" })
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
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const payload = mapFormDataToApiPayload(formData);
    try {
      const res = await fetch(isEdit && userId ? EDIT_API(userId) : CREATE_API, {
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
<<<<<<< HEAD
        <div className="bg-[#F6F4EE] rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Add User</h1>
          </div>
        </div>

        {/* Primary Details Section with Border Title */}
        <div className="relative mb-6">
          <div className="border-2 border-gray-300 rounded-lg pt-6 pb-6 px-6">
            <div className="absolute -top-4 left-6 bg-[#fafafa] px-3">
              <span className="text-lg font-semibold text-[#1A1A1A]">Primary Details</span>
            </div>

            <div className="flex gap-6">
=======
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
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
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
                  <label htmlFor="profile-upload">
                    <CameraButton component="span">
                      <Camera size={16} />
                    </CameraButton>
                  </label>
                </Box>
              </Box>

              {/* Form Fields */}
<<<<<<< HEAD
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Title */}
                <FloatingLabelField label="Select Title" required>
=======
              <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: '16px' }}>
                {/* Title */}
                <FormControl fullWidth size="small" sx={fieldStyles}>
                  <InputLabel required>Select Title</InputLabel>
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                  <Select
                    value={formData.title}
                    label="Select Title"
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  >
<<<<<<< HEAD
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* First Name */}
                <FloatingLabelField label="First Name" required>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="First Name"
                    className="border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </FloatingLabelField>

                {/* Last Name */}
                <FloatingLabelField label="Last Name" required>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Last Name"
                    className="border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </FloatingLabelField>

                {/* Email */}
                <FloatingLabelField label="Email" required>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="runwal.gardens@lockated.com"
                    className="border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </FloatingLabelField>

                {/* Mobile */}
                <FloatingLabelField label="Mobile">
                  <div className="flex gap-2">
=======
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
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                    <Select
                      value={formData.countryCode}
                      label="Code"
                      onChange={(e) => handleInputChange("countryCode", e.target.value)}
                    >
<<<<<<< HEAD
                      <SelectTrigger className="w-24 border-0 p-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) =>
                        handleInputChange("mobile", e.target.value)
                      }
                      placeholder="Mobile Number"
                      className="flex-1 border-0 p-0 focus:outline-none focus:ring-0"
                    />
                  </div>
                </FloatingLabelField>

                {/* Password */}
                <FloatingLabelField label="Password" required>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="••••••••••"
                      className="border-0 p-0 focus:outline-none focus:ring-0 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </FloatingLabelField>

                {/* Phase */}
                <FloatingLabelField label="Select Phase" required>
=======
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
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                  <Select
                    value={formData.phase}
                    label="Select Phase"
                    onChange={(e) => handleInputChange("phase", e.target.value)}
                  >
<<<<<<< HEAD
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phase 1">Phase 1</SelectItem>
                      <SelectItem value="Phase 2">Phase 2</SelectItem>
                      <SelectItem value="Phase 3">Phase 3</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Status */}
                <FloatingLabelField label="Select Status" required>
=======
                    <MenuItem value="Phase 1">Phase 1</MenuItem>
                    <MenuItem value="Phase 2">Phase 2</MenuItem>
                    <MenuItem value="Phase 3">Phase 3</MenuItem>
                  </Select>
                </FormControl>

                {/* Status */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Status</InputLabel>
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                  <Select
                    value={formData.status}
                    label="Select Status"
                    onChange={(e) => handleInputChange("status", e.target.value)}
                  >
<<<<<<< HEAD
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Tower */}
                <FloatingLabelField label="Select Tower" required>
=======
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                {/* Tower */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Tower</InputLabel>
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                  <Select
                    value={formData.tower}
                    label="Select Tower"
                    onChange={(e) => handleInputChange("tower", e.target.value)}
                  >
<<<<<<< HEAD
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tower A">Tower A</SelectItem>
                      <SelectItem value="Tower B">Tower B</SelectItem>
                      <SelectItem value="Tower C">Tower C</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Flat */}
                <FloatingLabelField label="Select Flat" required>
=======
                    <MenuItem value="Tower A">Tower A</MenuItem>
                    <MenuItem value="Tower B">Tower B</MenuItem>
                    <MenuItem value="Tower C">Tower C</MenuItem>
                  </Select>
                </FormControl>

                {/* Flat */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Flat</InputLabel>
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                  <Select
                    value={formData.flat}
                    label="Select Flat"
                    onChange={(e) => handleInputChange("flat", e.target.value)}
                  >
<<<<<<< HEAD
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Flat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">101</SelectItem>
                      <SelectItem value="102">102</SelectItem>
                      <SelectItem value="103">103</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Category */}
                <FloatingLabelField label="Select Category" required>
=======
                    <MenuItem value="101">101</MenuItem>
                    <MenuItem value="102">102</MenuItem>
                    <MenuItem value="103">103</MenuItem>
                  </Select>
                </FormControl>

                {/* Category */}
                <FormControl fullWidth required size="small" sx={fieldStyles}>
                  <InputLabel>Select Category</InputLabel>
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                  <Select
                    value={formData.category}
                    label="Select Category"
                    onChange={(e) => handleInputChange("category", e.target.value)}
                  >
<<<<<<< HEAD
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resident">Resident</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Alternate Address */}
                <div className="space-y-2 md:col-span-3 relative">
                  <div className="border-2 border-gray-300 rounded px-3 py-2">
                    <label className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Alternate Address
                    </label>
                    <Textarea
                      value={formData.alternateAddress}
                      onChange={(e) =>
                        handleInputChange("alternateAddress", e.target.value)
                      }
                      placeholder="Alternate Address"
                      className="border-0 focus:outline-none focus:ring-0 min-h-[80px] mt-2"
                    />
                  </div>
                </div>
=======
                    <MenuItem value="Resident">Resident</MenuItem>
                    <MenuItem value="Staff">Staff</MenuItem>
                    <MenuItem value="Vendor">Vendor</MenuItem>
                  </Select>
                </FormControl>

                {/* Alternate Address */}
                <TextField
                  fullWidth
                  size="small"
                  label="Alternate Address"
                  multiline
                  rows={3}
                  value={formData.alternateAddress}
                  onChange={(e) => handleInputChange("alternateAddress", e.target.value)}
                  sx={{ ...fieldStyles, gridColumn: { md: 'span 3' } }}
                />
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1

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
<<<<<<< HEAD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section with Border Title */}
        <div className="relative mb-6">
          <div className="border-2 border-gray-300 rounded-lg pt-6 pb-6 px-6">
            <div className="absolute -top-4 left-6 bg-[#fafafa] px-3">
              <span className="text-lg font-semibold text-[#1A1A1A]">Additional Info</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Birth Date */}
              <FloatingLabelField label="Birth Date">
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Anniversary */}
              <FloatingLabelField label="Anniversary">
                <Input
                  type="date"
                  value={formData.anniversary}
                  onChange={(e) =>
                    handleInputChange("anniversary", e.target.value)
                  }
                  placeholder="Anniversary Date"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Spouse Birth Date */}
              <FloatingLabelField label="Spouse Birth Date">
                <Input
                  type="date"
                  value={formData.spouseBirthDate}
                  onChange={(e) =>
                    handleInputChange("spouseBirthDate", e.target.value)
                  }
                  placeholder="Spouse Birth Date"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Alternate Email 1 */}
              <FloatingLabelField label="Alternate Email-1">
                <Input
                  type="email"
                  value={formData.alternateEmail1}
                  onChange={(e) =>
                    handleInputChange("alternateEmail1", e.target.value)
                  }
                  placeholder="Alternate Email-1"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Alternate Email 2 */}
              <FloatingLabelField label="Alternate Email-2">
                <Input
                  type="email"
                  value={formData.alternateEmail2}
                  onChange={(e) =>
                    handleInputChange("alternateEmail2", e.target.value)
                  }
                  placeholder="Alternate Email-2"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Landline Number */}
              <FloatingLabelField label="Landline Number">
                <Input
                  type="tel"
                  value={formData.landlineNumber}
                  onChange={(e) =>
                    handleInputChange("landlineNumber", e.target.value)
                  }
                  placeholder="Landline Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Intercom Number */}
              <FloatingLabelField label="Intercom Number">
                <Input
                  type="text"
                  value={formData.intercomNumber}
                  onChange={(e) =>
                    handleInputChange("intercomNumber", e.target.value)
                  }
                  placeholder="Intercom Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* GST Number */}
              <FloatingLabelField label="GST Number">
                <Input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    handleInputChange("gstNumber", e.target.value)
                  }
                  placeholder="GST Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* PAN Number */}
              <FloatingLabelField label="PAN Number">
                <Input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleInputChange("panNumber", e.target.value)
                  }
                  placeholder="PAN Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* EV Connection */}
              <FloatingLabelField label="EV Connection">
=======
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
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
                <Select
                  value={formData.evConnection}
                  label="EV Connection"
                  onChange={(e) => handleInputChange("evConnection", e.target.value)}
                >
<<<<<<< HEAD
                  <SelectTrigger className="border-0 p-0">
                    <SelectValue placeholder="NA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NA">NA</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </FloatingLabelField>

              {/* No. of Pets */}
              <FloatingLabelField label="No. of Pets">
                <Input
                  type="number"
                  value={formData.noOfPets}
                  onChange={(e) =>
                    handleInputChange("noOfPets", e.target.value)
                  }
                  placeholder="Pets"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* No. of Adult Family Members Residing */}
              <FloatingLabelField label="No. of Adults Residing">
                <Input
                  type="number"
                  value={formData.noOfAdults}
                  onChange={(e) =>
                    handleInputChange("noOfAdults", e.target.value)
                  }
                  placeholder="Adults"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* No. of Children Residing */}
              <FloatingLabelField label="No. of Children Residing">
                <Input
                  type="number"
                  value={formData.noOfChildren}
                  onChange={(e) =>
                    handleInputChange("noOfChildren", e.target.value)
                  }
                  placeholder="Children"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>
=======
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
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1

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
<<<<<<< HEAD
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleSubmit}
            className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white px-12"
          >
            Submit
          </Button>
          <Button
            onClick={handleCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white px-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
=======
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
>>>>>>> d93b2353d7dab8bda166c1ddd59e8c18822102e1
  );
};

export default AddUserPage;
