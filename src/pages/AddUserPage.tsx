import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

 const AddUserPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    // Add your submit logic here
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
            Add User
          </h1>
        </Paper>

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
                  <label htmlFor="profile-upload">
                    <CameraButton component="span">
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
                    <MenuItem value="Phase 1">Phase 1</MenuItem>
                    <MenuItem value="Phase 2">Phase 2</MenuItem>
                    <MenuItem value="Phase 3">Phase 3</MenuItem>
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
                    onChange={(e) => handleInputChange("tower", e.target.value)}
                  >
                    <MenuItem value="Tower A">Tower A</MenuItem>
                    <MenuItem value="Tower B">Tower B</MenuItem>
                    <MenuItem value="Tower C">Tower C</MenuItem>
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
                    <MenuItem value="101">101</MenuItem>
                    <MenuItem value="102">102</MenuItem>
                    <MenuItem value="103">103</MenuItem>
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
            <RedButton onClick={handleSubmit}>Submit</RedButton>
            <DraftButton onClick={handleCancel}>Cancel</DraftButton>
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
};

export default AddUserPage;
