import React, { useEffect, useState, useRef } from "react";
import { X, Upload, FileText, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';
import { toast } from "sonner";
import axios from "axios";

interface AddFlatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchFlats: () => void
}

export const AddFlatDialog: React.FC<AddFlatDialogProps> = ({
  open,
  onOpenChange,
  fetchFlats
}) => {
  const baseUrl = localStorage.getItem("baseUrl")
  const token = localStorage.getItem("token")

  const [towerOptions, setTowerOptions] = useState([])
  const [floorOptions, setFloorOptions] = useState([])
  const [flatTypeOptions, setFlatTypeOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [rmUsers, setRmUsers] = useState([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    project: "",
    status: true,
    possession: true,
    sold: false,
    tower: "",
    wing: "",
    flat: "",
    floor: "",
    carpetArea: "",
    builtUpArea: "",
    flatType: "",
    occupied: "",
    nameOnBill: "",
    dateOfPossession: "",
    rmUser: "",
  });

  const [projectOptions, setProjectOptions] = useState([]);
  const [wingOptions, setWingOptions] = useState([]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/builder_projects/dropdown_projects.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const raw = response.data;
      if (Array.isArray(raw?.builder_projects)) setProjectOptions(raw.builder_projects);
      else if (Array.isArray(raw)) setProjectOptions(raw);
      else if (Array.isArray(raw?.projects)) setProjectOptions(raw.projects);
    } catch (error) {
      console.log("Failed to fetch projects", error);
    }
  };

  const fetchTowers = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks.json?society_id=${localStorage.getItem('selectedSocietyId')}&q[active_eq]=1`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setTowerOptions(response.data.society_blocks)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch towers")
    }
  }

  const fetchWings = async () => {
    if (!formData.tower) {
      setWingOptions([]);
      return;
    }
    try {
      const response = await axios.get(`https://${baseUrl}/wings.json?tower_id=${formData.tower}&q[active_eq]=1`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWingOptions(response.data || []);
    } catch (error) {
      console.log("Failed to fetch wings", error);
    }
  };

  const fetchFloors = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/society_floors.json?society_block_id=${formData.tower}&q[active_eq]=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setFloorOptions(response.data || []);
    } catch (error) {
      console.error("Error fetching floors:", error);
    }
  };

  const fetchFlatTypes = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/flat_types.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setFlatTypeOptions(response.data)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch flat types")
    }
  }

  const fetchRmUsers = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/rm_users/society_rm_users.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setRmUsers(response.data.rm_users)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch RM users")
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchTowers();
    fetchFlatTypes();
    fetchRmUsers();
  }, []);

  useEffect(() => {
    if (formData.tower) {
      fetchWings();
      fetchFloors();
    }
  }, [formData.tower]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setAttachment(file);
    setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
    e.target.value = "";
  };

  const removeAttachment = () => {
    if (preview) URL.revokeObjectURL(preview);
    setAttachment(null);
    setPreview("");
  };

  const filteredTowers = towerOptions.filter((t: any) => !formData.project || t.project_id?.toString() === formData.project);

  const onChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.tower) {
      toast.error("Please select a tower");
      return;
    }

    const fd = new FormData();
    fd.append("society_flat[society_block_id]", formData.tower);
    if (formData.wing) fd.append("society_flat[wing_id]", formData.wing);
    if (formData.floor) fd.append("society_flat[society_floor_id]", formData.floor);
    if (formData.flat.trim()) fd.append("society_flat[flat_no]", formData.flat);
    if (formData.carpetArea) fd.append("society_flat[build_up_area]", formData.carpetArea);
    if (formData.builtUpArea) fd.append("society_flat[super_area]", formData.builtUpArea);
    if (formData.flatType) fd.append("society_flat[society_flat_type_id]", formData.flatType);
    if (formData.occupied) fd.append("society_flat[occupancy]", formData.occupied);
    if (formData.nameOnBill) fd.append("society_flat[bill_to_party]", formData.nameOnBill);
    if (formData.dateOfPossession) fd.append("society_flat[date_of_possession]", formData.dateOfPossession);
    if (formData.rmUser) fd.append("society_flat[rm_user_id]", formData.rmUser);
    fd.append("society_flat[possession]", String(formData.possession));
    fd.append("society_flat[sold]", String(formData.sold));
    fd.append("society_flat[approve]", String(formData.status));
    fd.append("society_id", localStorage.getItem('selectedSocietyId') || "");
    if (attachment) fd.append("society_flat[file]", attachment);

    setLoading(true)
    try {
      await axios.post(`https://${baseUrl}/crm/admin/society_flats.json`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }
      })

      toast.success("Flat added successfully!")
      fetchFlats()
      onOpenChange(false)
      if (preview) URL.revokeObjectURL(preview);
      setAttachment(null);
      setPreview("");
      setFormData({
        project: "",
        status: true,
        possession: true,
        sold: false,
        tower: "",
        wing: "",
        floor: "",
        flat: "",
        carpetArea: "",
        builtUpArea: "",
        flatType: "",
        occupied: "",
        nameOnBill: "",
        dateOfPossession: "",
        rmUser: "",
      })
    } catch (error) {
      console.log(error)
      toast.error("Failed to add flat")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-[rgba(26,26,24,.09)] shadow-none">
        <DialogHeader className="border-b border-[rgba(26,26,24,.09)] pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-[#1A1A18]">Add Flat</DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="flex items-center justify-center w-8 h-8 rounded-md text-[rgba(26,26,24,.68)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Status, Possession, Sold Toggles */}
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <Label htmlFor="status" className="text-sm font-medium">Status:</Label>
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => onChange('status', checked)}
                className="data-[state=checked]:!bg-[#798c5e] data-[state=unchecked]:!bg-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="possession" className="text-sm font-medium">Possession:</Label>
              <Switch
                id="possession"
                checked={formData.possession}
                onCheckedChange={(checked) => onChange('possession', checked)}
                className="data-[state=checked]:!bg-[#798c5e] data-[state=unchecked]:!bg-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sold" className="text-sm font-medium">Sold:</Label>
              <Switch
                id="sold"
                checked={formData.sold}
                onCheckedChange={(checked) => onChange('sold', checked)}
                className="data-[state=checked]:!bg-[#798c5e] data-[state=unchecked]:!bg-gray-300"
              />
            </div>
          </div>

          {/* Project, Tower, Wing, Flat */}
          <div className="grid grid-cols-2 gap-4">
            {/* <div className="relative">
              <Label htmlFor="project" className="absolute -top-2 left-3 text-xs text-gray-500 bg-white px-1 z-10">
                Project
              </Label>
              <SearchableSelect
                value={formData.project}
                onChange={(value) => {
                  onChange('project', value);
                  onChange('tower', "");
                  onChange('wing', "");
                }}
                options={projectOptions.map((project: any) => ({
                  value: project.id.toString(),
                  label: project.name || project.project_name,
                }))}
                placeholder="Select Project"
                className="pt-2"
              />
            </div> */}

            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Tower <span style={{ color: '#1A1A18' }}>*</span></InputLabel>
              <MuiSelect
                value={formData.tower}
                onChange={(e) => {
                  onChange('tower', e.target.value);
                  onChange('wing', "");
                }}
                displayEmpty
                label="Tower *"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled><span className="text-gray-400">Select Tower</span></MenuItem>
                {filteredTowers.map((tower: any) => (
                  <MenuItem key={tower.id} value={tower.id.toString()}>
                    {tower.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

            {/* <div className="relative">
              <Label htmlFor="wing" className="absolute -top-2 left-3 text-xs text-gray-500 bg-white px-1 z-10">
                Wing
              </Label>
              <SearchableSelect
                value={formData.wing}
                onChange={(value) => onChange('wing', value)}
                options={wingOptions.map((wing: any) => ({
                  value: wing.id.toString(),
                  label: wing.wing,
                }))}
                placeholder="Select Wing"
                className="pt-2"
              />
            </div> */}

            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Floor</InputLabel>
              <MuiSelect
                value={formData.floor}
                onChange={(e) => onChange('floor', e.target.value)}
                displayEmpty
                label="Floor"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><span className="text-gray-400">Select Floor</span></MenuItem>
                {floorOptions.map((floor: any) => (
                  <MenuItem key={floor.id} value={floor.id.toString()}>
                    {floor.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

            <TextField
              label="Flat"
              placeholder="Enter flat"
              value={formData.flat}
              onChange={(e) => onChange('flat', e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <TextField
              label="Carpet Area"
              placeholder="Enter carpet area"
              value={formData.carpetArea}
              onChange={(e) => onChange('carpetArea', e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <TextField
              label="Built up Area"
              placeholder="Enter built up area"
              value={formData.builtUpArea}
              onChange={(e) => onChange('builtUpArea', e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Flat Type</InputLabel>
              <MuiSelect
                value={formData.flatType}
                onChange={(e) => onChange('flatType', e.target.value)}
                displayEmpty
                label="Flat Type"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><span className="text-gray-400">Select Flat Type</span></MenuItem>
                {flatTypeOptions.map((flatType: any) => (
                  <MenuItem key={flatType.id} value={flatType.id.toString()}>
                    {flatType.society_flat_type}
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Occupied</InputLabel>
              <MuiSelect
                value={formData.occupied}
                onChange={(e) => onChange('occupied', e.target.value)}
                displayEmpty
                label="Occupied"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><span className="text-gray-400">Please Select</span></MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </MuiSelect>
            </MuiFormControl>

            <TextField
              label="Name on Bill"
              placeholder="Enter name on bill"
              value={formData.nameOnBill}
              onChange={(e) => onChange('nameOnBill', e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <TextField
              label="Date of possession"
              type="date"
              value={formData.dateOfPossession}
              onChange={(e) => onChange('dateOfPossession', e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Rm User</InputLabel>
              <MuiSelect
                value={formData.rmUser}
                onChange={(e) => onChange('rmUser', e.target.value)}
                displayEmpty
                label="Rm User"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><span className="text-gray-400">Select</span></MenuItem>
                {rmUsers.length === 0 ? (
                  <MenuItem value="no-rm-user" disabled><span className="text-gray-400">No Rm User Found</span></MenuItem>
                ) : (
                  rmUsers.map((user: any) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </MuiFormControl>
          </div>

          {/* Attachment Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Attachment</Label>

            {!attachment ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#EBE9E2] rounded-xl p-8 cursor-pointer hover:border-[#1A1A18] transition-colors"
              >
                <Upload className="h-7 w-7 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Click to upload a file</p>
                <p className="text-xs text-gray-400">Image, PDF, or document</p>
              </div>
            ) : (
              <div className="relative group rounded-xl border border-[#EBE9E2] overflow-hidden bg-[#F5F4F0]">
                {preview ? (
                  <img
                    src={preview}
                    alt={attachment.name}
                    className="w-full max-h-48 object-contain bg-white"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <FileText className="h-10 w-10 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-400">{(attachment.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="absolute top-2 right-2 bg-[#1A1A18] text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-[#12100E] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {preview && (
                  <div className="px-3 py-2 bg-white border-t border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{attachment.name}</p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
