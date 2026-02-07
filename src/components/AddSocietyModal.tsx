import React, { useState, useEffect } from "react";
import {
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { SocietyFormData, EstateBuilder, Headquarter, Region, Zone } from "@/types/society";
import { Loader2, X } from "lucide-react";

interface Company {
  id: number;
  name: string;
}

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
  const [companies, setCompanies] = useState<Company[]>([]);
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
    super_society_id: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch estate builders on mount
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
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

  const fetchCompanies = async () => {
    try {
      const url = getFullUrl("/pms/company_setups/company_index.json?per_page=1000");
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch companies");
      const result = await response.json();
      const companiesData = result.data || result.companies || result || [];
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    }
  };

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
      const url = getFullUrl("/headquarters.json");
      const response = await fetch(url, { headers: { Authorization: getAuthHeader() } });
      if (!response.ok) throw new Error("Failed to fetch headquarters");
      const data = await response.json();
      const headquartersData = data.headquarters || data || [];
      setHeadquarters(headquartersData);
    } catch (error) {
      console.error("Error fetching headquarters:", error);
      toast.error("Failed to load headquarters");
    }
  };

  const fetchRegions = async (headquarterId: number) => {
    try {
      const url = getFullUrl(`/pms/headquarters/${headquarterId}/regions.json`);
      const response = await fetch(url, { headers: { Authorization: getAuthHeader() } });
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
      const response = await fetch(url, { headers: { Authorization: getAuthHeader() } });
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
      super_society_id: undefined,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={false}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white z-50">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            ADD NEW SOCIETY
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-sm font-medium text-[#C72030] mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <TextField
                label="Society Name"
                placeholder="Enter society name"
                value={formData.building_name}
                onChange={(e) => handleChange("building_name", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                  required: true,
                  sx: { "& .MuiFormLabel-asterisk": { color: "#C72030" } },
                }}
                InputProps={{ sx: fieldStyles }}
                required
                error={Boolean(errors.building_name)}
                helperText={errors.building_name}
              />
              <TextField
                label="Bill To"
                placeholder="Enter bill to"
                value={formData.bill_to}
                onChange={(e) => handleChange("bill_to", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink required sx={{ "& .MuiFormLabel-asterisk": { color: "#C72030" } }}>Company</InputLabel>
                <MuiSelect
                  value={formData.company_id || ""}
                  onChange={(e) => handleChange("company_id", e.target.value)}
                  label="Company"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                  required
                >
                  <MenuItem value=""><em>Select Company</em></MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Real Estate Client</InputLabel>
                <MuiSelect
                  value={formData.builder_id || ""}
                  onChange={(e) => handleChange("builder_id", e.target.value)}
                  label="Real Estate Client"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Real Estate Client</em></MenuItem>
                  {estateBuilders.map((builder) => (
                    <MenuItem key={builder.id} value={builder.id}>
                      {builder.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              <TextField
                label="Registration"
                placeholder="Enter registration"
                value={formData.registration}
                onChange={(e) => handleChange("registration", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Project Type</InputLabel>
                <MuiSelect
                  value={formData.project_type || ""}
                  onChange={(e) => handleChange("project_type", e.target.value)}
                  label="Project Type"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Project Type</em></MenuItem>
                  <MenuItem value="Residential">Residential</MenuItem>
                  <MenuItem value="Commercial">Commercial</MenuItem>
                </MuiSelect>
              </FormControl>
              <TextField
                label="App ID"
                placeholder="Enter app ID"
                value={formData.app_id}
                onChange={(e) => handleChange("app_id", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="mt-6">
              <TextField
                label="Description"
                placeholder="Enter society description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
                multiline
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mt-6">
              <div className="space-y-1">
                <span className="text-sm font-medium">Status</span>
                <p className="text-xs text-gray-600">
                  Set whether this society is active or inactive
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.active}
                      onChange={(e) => handleChange("active", e.target.checked)}
                    />
                  }
                  label={formData.active ? "Active" : "Inactive"}
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-sm font-medium text-[#C72030] mb-4">
              Location & Hierarchy
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Headquarter (Country)</InputLabel>
                <MuiSelect
                  value={formData.headquarter_id || ""}
                  onChange={(e) => handleChange("headquarter_id", e.target.value)}
                  label="Headquarter (Country)"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Headquarter</em></MenuItem>
                  {headquarters.map((hq) => (
                    <MenuItem key={hq.id} value={hq.id}>
                      {hq.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Region (State)</InputLabel>
                <MuiSelect
                  value={formData.region_id || ""}
                  onChange={(e) => handleChange("region_id", e.target.value)}
                  label="Region (State)"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                  disabled={!formData.headquarter_id}
                >
                  <MenuItem value=""><em>Select Region</em></MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region.id} value={region.id}>
                      {region.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Zone (City)</InputLabel>
                <MuiSelect
                  value={formData.zone_id || ""}
                  onChange={(e) => handleChange("zone_id", e.target.value)}
                  label="Zone (City)"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                  disabled={!formData.region_id}
                >
                  <MenuItem value=""><em>Select Zone</em></MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              <TextField
                label="URL"
                placeholder="Enter URL"
                value={formData.url}
                onChange={(e) => handleChange("url", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          {/* Address Information Section */}
          <div>
            <h3 className="text-sm font-medium text-[#C72030] mb-4">
              Address Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <TextField
                label="Address Line 1"
                placeholder="Enter address line 1"
                value={formData.address1}
                onChange={(e) => handleChange("address1", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Address Line 2"
                placeholder="Enter address line 2"
                value={formData.address2}
                onChange={(e) => handleChange("address2", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <TextField
                label="Area"
                placeholder="Enter area"
                value={formData.area}
                onChange={(e) => handleChange("area", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Postcode"
                placeholder="Enter postcode"
                type="number"
                value={formData.postcode || ""}
                onChange={(e) => handleChange("postcode", parseInt(e.target.value) || undefined)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <TextField
                label="City"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="State"
                placeholder="Enter state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <TextField
                label="Country"
                placeholder="Enter country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Latitude"
                placeholder="Enter latitude"
                value={formData.latitude}
                onChange={(e) => handleChange("latitude", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Longitude"
                placeholder="Enter longitude"
                value={formData.longitude}
                onChange={(e) => handleChange("longitude", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          {/* Device & Billing Section */}
          <div>
            <h3 className="text-sm font-medium text-[#C72030] mb-4">
              Device & Billing Information
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <TextField
                label="No. of Devices"
                placeholder="Enter number"
                type="number"
                value={formData.no_of_devices || ""}
                onChange={(e) => handleChange("no_of_devices", parseInt(e.target.value) || undefined)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Device Rental Type</InputLabel>
                <MuiSelect
                  value={formData.device_rental_type || ""}
                  onChange={(e) => handleChange("device_rental_type", e.target.value)}
                  label="Device Rental Type"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                >
                  <MenuItem value=""><em>Select Type</em></MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Yearly">Yearly</MenuItem>
                </MuiSelect>
              </FormControl>
              <TextField
                label="Rental Rate"
                placeholder="Enter rate"
                type="number"
                value={formData.device_rental_rate || ""}
                onChange={(e) => handleChange("device_rental_rate", parseFloat(e.target.value) || undefined)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <TextField
                label="Billing Term"
                placeholder="Enter billing term"
                value={formData.billing_term}
                onChange={(e) => handleChange("billing_term", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Billing Rate"
                placeholder="Enter rate"
                type="number"
                value={formData.billing_rate || ""}
                onChange={(e) => handleChange("billing_rate", parseFloat(e.target.value) || undefined)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Billing Cycle"
                placeholder="Enter cycle"
                value={formData.billing_cycle}
                onChange={(e) => handleChange("billing_cycle", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <TextField
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div>
            <h3 className="text-sm font-medium text-[#C72030] mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <TextField
                label="Approve"
                placeholder="Enter approval"
                value={formData.approve}
                onChange={(e) => handleChange("approve", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Comment"
                placeholder="Enter comment"
                value={formData.comment}
                onChange={(e) => handleChange("comment", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
            <div className="mt-6">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allow_view_toggle}
                    onChange={(e) => handleChange("allow_view_toggle", e.target.checked)}
                  />
                }
                label="Allow View Toggle"
              />
            </div>
          </div>
        
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !canEdit}
            className="bg-[#c72030] hover:bg-[#a01828]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Add Society"
            )}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
