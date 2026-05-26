import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
import { Switch } from "@/components/ui/switch";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zoneId: number;
  canEdit: boolean;
}

interface ZoneFormData {
  name: string;
  headquarter_id: string;
  region_id: string;
  active: boolean;
}

interface HQOption {
  id: number;
  label: string;
  company_id: number;
}

interface RegionOption {
  id: number;
  name: string;
}

const fieldStyles = {
  height: "45px",
  "& .MuiInputBase-root": { height: "45px" },
  "& .MuiInputBase-input": { padding: "12px 14px" },
  "& .MuiSelect-select": { padding: "12px 14px" },
};

const selectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 224,
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
      zIndex: 9999,
    },
  },
  disablePortal: false,
  disableAutoFocus: true,
  disableEnforceFocus: true,
};

export const EditZoneModal: React.FC<EditZoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zoneId,
  canEdit,
}) => {
  const { getFullUrl, getAuthHeader } = useApiConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hqOptions, setHqOptions] = useState<HQOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [formData, setFormData] = useState<ZoneFormData>({
    name: "",
    headquarter_id: "",
    region_id: "",
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchHeadquarters = useCallback(async () => {
    try {
      const response = await fetch(getFullUrl("/headquarters/all_headquarters.json"), {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.headquarters || [];
        setHqOptions(
          list.map((hq: { id: number; company?: { id: number; name: string }; country?: { id: number; name: string } }) => ({
            id: hq.id,
            label: hq.country?.name || "",
            company_id: hq.company?.id || 0,
          }))
        );
      }
    } catch {
      toast.error("Failed to load headquarters");
    }
  }, [getAuthHeader, getFullUrl]);

  const fetchRegions = useCallback(async (hqId: string) => {
    if (!hqId) { setRegionOptions([]); return; }
    setRegionsLoading(true);
    try {
      const response = await fetch(getFullUrl(`/headquarters/${hqId}/regions`), {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const list: RegionOption[] = Array.isArray(data) ? data : data.regions || [];
        setRegionOptions(list);
      }
    } catch {
      toast.error("Failed to load regions");
    } finally {
      setRegionsLoading(false);
    }
  }, [getAuthHeader, getFullUrl]);

  const fetchZoneDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl(`/pms/zones/${zoneId}.json`), {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const zone = result.zone || result.data || result;

      const hqId = zone.headquarter_id?.toString() || "";
      setFormData({
        name: zone.name || "",
        headquarter_id: hqId,
        region_id: zone.region_id?.toString() || "",
        active: zone.active !== undefined ? zone.active : true,
      });

      if (hqId) fetchRegions(hqId);
    } catch (error: unknown) {
      toast.error(`Failed to load zone: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader, getFullUrl, zoneId, fetchRegions]);

  useEffect(() => {
    if (isOpen && zoneId) {
      fetchHeadquarters();
      fetchZoneDetails();
    }
  }, [isOpen, zoneId, fetchHeadquarters, fetchZoneDetails]);

  const handleChange = (field: keyof ZoneFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "headquarter_id") {
      setFormData((prev) => ({ ...prev, headquarter_id: value as string, region_id: "" }));
      fetchRegions(value as string);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Zone name is required";
    if (!formData.headquarter_id) newErrors.headquarter_id = "Headquarter is required";
    if (!formData.region_id) newErrors.region_id = "Region is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!canEdit) { toast.error("You do not have permission to update zones"); return; }
    if (!validate()) { toast.error("Please fix the errors in the form"); return; }

    setIsSubmitting(true);
    try {
      const response = await fetch(getFullUrl(`/pms/zones/${zoneId}.json`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
          pms_zone: {
            name: formData.name,
            headquarter_id: parseInt(formData.headquarter_id),
            company_id: hqOptions.find((h) => h.id.toString() === formData.headquarter_id)?.company_id,
            region_id: parseInt(formData.region_id),
            active: formData.active,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update zone");
      }

      toast.success("Zone updated successfully!");
      onSuccess();
    } catch (error: unknown) {
      toast.error(`Failed to update zone: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", headquarter_id: "", region_id: "", active: true });
    setRegionOptions([]);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={false}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white z-50"
        aria-describedby="edit-zone-dialog-description"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">EDIT ZONE</DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </Button>
          <div id="edit-zone-dialog-description" className="sr-only">Edit zone details</div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
            <span className="ml-2 text-gray-600">Loading zone data...</span>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-sm font-medium text-[#C72030] mb-4">Basic Information</h3>

              <div className="grid grid-cols-2 gap-6">
               

                <FormControl fullWidth variant="outlined" error={!!errors.headquarter_id} required>
                  <InputLabel shrink sx={{ "& .MuiFormLabel-asterisk": { color: "#C72030" } }}>
                    Headquarter
                  </InputLabel>
                  <MuiSelect
                    value={formData.headquarter_id}
                    onChange={(e) => handleChange("headquarter_id", e.target.value)}
                    label="Headquarter"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    sx={fieldStyles}
                    disabled={isSubmitting}
                  >
                    <MenuItem value=""><em>Select Headquarter</em></MenuItem>
                    {hqOptions.map((hq) => (
                      <MenuItem key={hq.id} value={hq.id.toString()}>{hq.label}</MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.headquarter_id && (
                    <div className="text-red-500 text-xs mt-1">{errors.headquarter_id}</div>
                  )}
                </FormControl>
                 <FormControl fullWidth variant="outlined" error={!!errors.region_id} required>
                  <InputLabel shrink sx={{ "& .MuiFormLabel-asterisk": { color: "#C72030" } }}>
                    Region
                  </InputLabel>
                  <MuiSelect
                    value={formData.region_id}
                    onChange={(e) => handleChange("region_id", e.target.value)}
                    label="Region"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    sx={fieldStyles}
                    disabled={isSubmitting || !formData.headquarter_id || regionsLoading}
                  >
                    <MenuItem value="">
                      <em>{regionsLoading ? "Loading regions..." : !formData.headquarter_id ? "Select headquarter first" : "Select Region"}</em>
                    </MenuItem>
                    {regionOptions.map((r) => (
                      <MenuItem key={r.id} value={r.id.toString()}>{r.name}</MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.region_id && (
                    <div className="text-red-500 text-xs mt-1">{errors.region_id}</div>
                  )}
                </FormControl>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
               
                 <TextField
                  label="Zone Name"
                  placeholder="Enter zone name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true, sx: { "& .MuiFormLabel-asterisk": { color: "#C72030" } } }}
                  InputProps={{ sx: fieldStyles }}
                  required
                  disabled={isSubmitting}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </div>

              <div className="flex items-center gap-3 mt-6">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => handleChange("active", checked)}
                    disabled={isSubmitting}
                  />
                  <span className={`text-sm font-medium ${formData.active ? "text-green-600" : "text-red-600"}`}>
                    {formData.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="px-6 py-2">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canEdit || isLoading}
            className="px-6 py-2 bg-[#C72030] text-white hover:bg-[#A61B29] disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Zone"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
