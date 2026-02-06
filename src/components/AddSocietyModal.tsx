import React, { useState, useEffect } from "react";
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
  Divider,
} from "@mui/material";
import { Button as MuiButton } from "@mui/material";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { SocietyFormData, EstateBuilder, Headquarter, Region, Zone } from "@/types/society";
import { Loader2 } from "lucide-react";

interface AddSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  canEdit: boolean;
}

const fieldStyles = {
  height: { xs: 28, sm: 36, md: 45 },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    padding: { xs: "8px", sm: "10px", md: "12px" },
  },
};

const selectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 99999,
      overflow: "auto",
    },
  },
  anchorOrigin: { vertical: "bottom" as const, horizontal: "left" as const },
  transformOrigin: { vertical: "top" as const, horizontal: "left" as const },
  disablePortal: false,
  disableScrollLock: true,
};

export const AddSocietyModal: React.FC<AddSocietyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  canEdit,
}) => {
  const { getFullUrl, getAuthHeader } = useApiConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  // Debug
  useEffect(() => {
    console.log("🟢 AddSocietyModal isOpen changed:", isOpen);
  }, [isOpen]);

  // Dropdowns
  const [estateBuilders, setEstateBuilders] = useState<EstateBuilder[]>([]);
  const [headquarters, setHeadquarters] = useState<Headquarter[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const [formData, setFormData] = useState<SocietyFormData>({
    building_name: "",
    bill_to: "",
    builder_id: undefined,
    headquarter_id: undefined,
    region_id: undefined,
    zone_id: undefined,
    app_id: "",
    url: "",
    no_of_devices: undefined,
    device_rental_type: "",
    device_rental_rate: undefined,
    address1: "",
    address2: "",
    area: "",
    postcode: undefined,
    city: "",
    state: "",
    country: "India",
    latitude: "",
    longitude: "",
    billing_term: "",
    billing_rate: undefined,
    billing_cycle: "",
    start_date: "",
    end_date: "",
    registration: "",
    approve: "",
    comment: "",
    project_type: "",
    allow_view_toggle: false,
    active: true,
    description: "",
    IsDelete: 0,
    company_id: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch estate builders on mount
  useEffect(() => {
    if (isOpen) {
      fetchEstateBuilders();
      fetchHeadquarters();
    }
  }, [isOpen]);

  // Fetch regions when headquarter changes
  useEffect(() => {
    if (formData.headquarter_id) {
      fetchRegions(formData.headquarter_id);
    } else {
      setRegions([]);
      setZones([]);
    }
  }, [formData.headquarter_id]);

  // Fetch zones when region changes
  useEffect(() => {
    if (formData.region_id) {
      fetchZones(formData.region_id);
    } else {
      setZones([]);
    }
  }, [formData.region_id]);

  const fetchEstateBuilders = async () => {
    try {
      setIsLoadingDropdowns(true);
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/crm/estate_builders.json?token=${token}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch estate builders");
      const data = await response.json();
      setEstateBuilders(data || []);
    } catch (error) {
      console.error("Error fetching estate builders:", error);
      toast.error("Failed to load real estate clients");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const fetchHeadquarters = async () => {
    try {
      const url = getFullUrl("/pms/headquarters.json");
      const response = await fetch(url, { headers: getAuthHeader() });
      if (!response.ok) throw new Error("Failed to fetch headquarters");
      const data = await response.json();
      setHeadquarters(data.headquarters || []);
    } catch (error) {
      console.error("Error fetching headquarters:", error);
      toast.error("Failed to load headquarters");
    }
  };

  const fetchRegions = async (headquarterId: number) => {
    try {
      const url = getFullUrl(`/pms/headquarters/${headquarterId}/regions.json`);
      const response = await fetch(url, { headers: getAuthHeader() });
      if (!response.ok) throw new Error("Failed to fetch regions");
      const data = await response.json();
      setRegions(data.regions || []);
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast.error("Failed to load regions");
    }
  };

  const fetchZones = async (regionId: number) => {
    try {
      const url = getFullUrl(`/pms/regions/${regionId}/zones.json`);
      const response = await fetch(url, { headers: getAuthHeader() });
      if (!response.ok) throw new Error("Failed to fetch zones");
      const data = await response.json();
      setZones(data.zones || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error("Failed to load zones");
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.building_name.trim()) {
      newErrors.building_name = "Society name is required";
    }

    // Add more validations as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/societies.json?token=${token}`;

      const payload = {
        society: {
          ...formData,
          approve: formData.approve === "Yes" ? "Yes" : "No",
        },
      };

      console.log("🚀 Creating society:", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create society");
      }

      toast.success("Society created successfully");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error creating society:", error);
      toast.error(error.message || "Failed to create society");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      building_name: "",
      bill_to: "",
      builder_id: undefined,
      headquarter_id: undefined,
      region_id: undefined,
      zone_id: undefined,
      app_id: "",
      url: "",
      no_of_devices: undefined,
      device_rental_type: "",
      device_rental_rate: undefined,
      address1: "",
      address2: "",
      area: "",
      postcode: undefined,
      city: "",
      state: "",
      country: "India",
      latitude: "",
      longitude: "",
      billing_term: "",
      billing_rate: undefined,
      billing_cycle: "",
      start_date: "",
      end_date: "",
      registration: "",
      approve: "",
      comment: "",
      project_type: "",
      allow_view_toggle: false,
      active: true,
      description: "",
      IsDelete: 0,
      company_id: undefined,
    });
    setErrors({});
    onClose();
  };

  return (
    <MuiDialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "90vh",
          zIndex: 9999,
        },
      }}
      sx={{
        zIndex: 9999,
      }}
    >
      <MuiDialogTitle
        sx={{
          bgcolor: "#F6F4EE",
          color: "#1a1a1a",
          fontWeight: "bold",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        Add New Society
      </MuiDialogTitle>

      <MuiDialogContent sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2}>
          {/* Society Name */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Society Name *"
              fullWidth
              value={formData.building_name}
              onChange={(e) => handleChange("building_name", e.target.value)}
              error={Boolean(errors.building_name)}
              helperText={errors.building_name}
              sx={fieldStyles}
            />
          </Grid>

          {/* Bill To */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Bill To"
              fullWidth
              value={formData.bill_to}
              onChange={(e) => handleChange("bill_to", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Real Estate Client */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Real Estate Client</InputLabel>
              <MuiSelect
                value={formData.builder_id || ""}
                onChange={(e) => handleChange("builder_id", e.target.value)}
                label="Real Estate Client"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Real Estate Client</MenuItem>
                {estateBuilders.map((builder) => (
                  <MenuItem key={builder.id} value={builder.id}>
                    {builder.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Headquarter (Country) */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Headquarter (Country)</InputLabel>
              <MuiSelect
                value={formData.headquarter_id || ""}
                onChange={(e) => handleChange("headquarter_id", e.target.value)}
                label="Headquarter (Country)"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Headquarter</MenuItem>
                {headquarters.map((hq) => (
                  <MenuItem key={hq.id} value={hq.id}>
                    {hq.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Region */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!formData.headquarter_id}>
              <InputLabel>Region</InputLabel>
              <MuiSelect
                value={formData.region_id || ""}
                onChange={(e) => handleChange("region_id", e.target.value)}
                label="Region"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Region</MenuItem>
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Zone */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!formData.region_id}>
              <InputLabel>Zone</InputLabel>
              <MuiSelect
                value={formData.zone_id || ""}
                onChange={(e) => handleChange("zone_id", e.target.value)}
                label="Zone"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Zone</MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* App ID */}
          <Grid item xs={12} md={6}>
            <TextField
              label="App ID"
              fullWidth
              value={formData.app_id}
              onChange={(e) => handleChange("app_id", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* URL */}
          <Grid item xs={12} md={6}>
            <TextField
              label="URL"
              fullWidth
              value={formData.url}
              onChange={(e) => handleChange("url", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* No. of Devices */}
          <Grid item xs={12} md={4}>
            <TextField
              label="No. of Devices"
              type="number"
              fullWidth
              value={formData.no_of_devices || ""}
              onChange={(e) => handleChange("no_of_devices", parseInt(e.target.value) || undefined)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Device Rental */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Device Rental</InputLabel>
              <MuiSelect
                value={formData.device_rental_type || ""}
                onChange={(e) => handleChange("device_rental_type", e.target.value)}
                label="Device Rental"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="Rental">Rental</MenuItem>
                <MenuItem value="Fixed">Fixed</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Rental Rate */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Rental Rate"
              type="number"
              fullWidth
              value={formData.device_rental_rate || ""}
              onChange={(e) => handleChange("device_rental_rate", parseFloat(e.target.value) || undefined)}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Address Information
              </Typography>
            </Divider>
          </Grid>

          {/* Address Line 1 */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Address Line 1"
              fullWidth
              value={formData.address1}
              onChange={(e) => handleChange("address1", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Address Line 2 */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Address Line 2"
              fullWidth
              value={formData.address2}
              onChange={(e) => handleChange("address2", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Area */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Area"
              fullWidth
              value={formData.area}
              onChange={(e) => handleChange("area", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Postcode */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Postcode"
              type="number"
              fullWidth
              value={formData.postcode || ""}
              onChange={(e) => handleChange("postcode", parseInt(e.target.value) || undefined)}
              sx={fieldStyles}
            />
          </Grid>

          {/* City */}
          <Grid item xs={12} md={6}>
            <TextField
              label="City"
              fullWidth
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* State */}
          <Grid item xs={12} md={6}>
            <TextField
              label="State"
              fullWidth
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Country */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Country"
              fullWidth
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              disabled
              sx={fieldStyles}
            />
          </Grid>

          {/* Latitude */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Latitude"
              fullWidth
              value={formData.latitude}
              onChange={(e) => handleChange("latitude", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Longitude */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Longitude"
              fullWidth
              value={formData.longitude}
              onChange={(e) => handleChange("longitude", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Billing Information
              </Typography>
            </Divider>
          </Grid>

          {/* Billing Term */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Billing Term</InputLabel>
              <MuiSelect
                value={formData.billing_term || ""}
                onChange={(e) => handleChange("billing_term", e.target.value)}
                label="Billing Term"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Billing Term</MenuItem>
                <MenuItem value="Fixed">Fixed</MenuItem>
                <MenuItem value="Per Site">Per Site</MenuItem>
                <MenuItem value="Per User">Per User</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Rate Of Billing */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Rate Of Billing"
              type="number"
              fullWidth
              value={formData.billing_rate || ""}
              onChange={(e) => handleChange("billing_rate", parseFloat(e.target.value) || undefined)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Billing Cycle */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Billing Cycle</InputLabel>
              <MuiSelect
                value={formData.billing_cycle || ""}
                onChange={(e) => handleChange("billing_cycle", e.target.value)}
                label="Billing Cycle"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Billing Cycle</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Quarterly">Quarterly</MenuItem>
                <MenuItem value="Half-Yearly">Half-Yearly</MenuItem>
                <MenuItem value="Yearly">Yearly</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={formData.start_date}
              onChange={(e) => handleChange("start_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} md={6}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              value={formData.end_date}
              onChange={(e) => handleChange("end_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Additional Information
              </Typography>
            </Divider>
          </Grid>

          {/* Registration */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Registration"
              fullWidth
              value={formData.registration}
              onChange={(e) => handleChange("registration", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Project Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Project Type</InputLabel>
              <MuiSelect
                value={formData.project_type || ""}
                onChange={(e) => handleChange("project_type", e.target.value)}
                label="Project Type"
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="">Select Project Type</MenuItem>
                <MenuItem value="Residential">Residential</MenuItem>
                <MenuItem value="Commercial">Commercial</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>

          {/* Approve */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Approve"
              fullWidth
              value={formData.approve}
              onChange={(e) => handleChange("approve", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Comment */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Comment"
              fullWidth
              value={formData.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </Grid>

          {/* Allow View Toggle */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.allow_view_toggle}
                  onChange={(e) => handleChange("allow_view_toggle", e.target.checked)}
                />
              }
              label="Allow View Toggle"
            />
          </Grid>

          {/* Active */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active}
                  onChange={(e) => handleChange("active", e.target.checked)}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </MuiDialogContent>

      <MuiDialogActions sx={{ p: 2, bgcolor: "#f9fafb", borderTop: "1px solid #e2e8f0" }}>
        <MuiButton onClick={handleClose} disabled={isSubmitting} sx={{ color: "#64748b" }}>
          Cancel
        </MuiButton>
        <MuiButton
          onClick={handleSubmit}
          disabled={isSubmitting || !canEdit}
          variant="contained"
          sx={{
            bgcolor: "#c72030",
            "&:hover": { bgcolor: "#a01828" },
            "&:disabled": { bgcolor: "#e2e8f0" },
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Add Society"
          )}
        </MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  );
};
