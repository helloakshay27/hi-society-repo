import React, { useEffect, useState, useRef } from "react";
import { X, Upload, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/SearchSelect";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Add Flat</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-red-500 hover:text-red-700 transition-colors"
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
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="possession" className="text-sm font-medium">Possession:</Label>
              <Switch
                id="possession"
                checked={formData.possession}
                onCheckedChange={(checked) => onChange('possession', checked)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sold" className="text-sm font-medium">Sold:</Label>
              <Switch
                id="sold"
                checked={formData.sold}
                onCheckedChange={(checked) => onChange('sold', checked)}
              />
            </div>
          </div>

          {/* Project, Tower, Wing, Flat */}
          <div className="grid grid-cols-2 gap-4">
            {/* <div className="relative">
              <Label htmlFor="project" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
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

            <div className="relative">
              <Label htmlFor="tower" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Tower <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={formData.tower}
                onChange={(value) => {
                  onChange('tower', value);
                  onChange('wing', "");
                }}
                options={filteredTowers.map((tower: any) => ({
                  value: tower.id.toString(),
                  label: tower.name,
                }))}
                placeholder="Select Tower"
                className="pt-2"
              />
            </div>

            {/* <div className="relative">
              <Label htmlFor="wing" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
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

            <div className="relative">
              <Label htmlFor="floor" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Floor
              </Label>
              <SearchableSelect
                value={formData.floor}
                onChange={(value) => onChange('floor', value)}
                options={floorOptions.map((floor) => ({
                  value: floor.id.toString(),
                  label: floor.name,
                }))}
                placeholder="Select Floor"
                className="pt-2"
              />
            </div>

            <div className="relative">
              <Label htmlFor="flat" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Flat
              </Label>
              <Input
                id="flat"
                placeholder=" "
                value={formData.flat}
                onChange={(e) => onChange('flat', e.target.value)}
                className="border border-gray-400"
              />
            </div>

            <div className="relative">
              <Label htmlFor="carpetArea" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Carpet Area</Label>
              <Input
                id="carpetArea"
                placeholder=" "
                value={formData.carpetArea}
                onChange={(e) => onChange('carpetArea', e.target.value)}
                className="border border-gray-400"
              />
            </div>

            <div className="relative">
              <Label htmlFor="builtUpArea" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Built up Area</Label>
              <Input
                id="builtUpArea"
                placeholder=" "
                value={formData.builtUpArea}
                onChange={(e) => onChange('builtUpArea', e.target.value)}
                className="border border-gray-400"
              />
            </div>

            <div className="relative">
              <Label htmlFor="flatType" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Flat Type
              </Label>
              <SearchableSelect
                value={formData.flatType}
                onChange={(value) => onChange('flatType', value)}
                options={flatTypeOptions.map((flatType) => ({
                  value: flatType.id.toString(),
                  label: flatType.society_flat_type,
                }))}
                placeholder="Select Flat Type"
                className="pt-2"
              />
            </div>

            <div className="relative">
              <Label htmlFor="occupied" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Occupied
              </Label>
              <SearchableSelect
                value={formData.occupied}
                onChange={(value) => onChange('occupied', value)}
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                ]}
                placeholder="Please Select"
                className="pt-2"
              />
            </div>

            <div className="relative">
              <Label htmlFor="nameOnBill" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Name on Bill</Label>
              <Input
                id="nameOnBill"
                placeholder=" "
                value={formData.nameOnBill}
                onChange={(e) => onChange('nameOnBill', e.target.value)}
                className="border border-gray-400"
              />
            </div>

            <div className="relative">
              <Label htmlFor="dateOfPossession" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Date of possession</Label>
              <Input
                id="dateOfPossession"
                type="date"
                placeholder=" "
                value={formData.dateOfPossession}
                onChange={(e) => onChange('dateOfPossession', e.target.value)}
                className="border border-gray-400"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Attachment Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Attachment</Label>

            {!attachment ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#0EA5E9] hover:bg-blue-50/40 transition-colors"
              >
                <Upload className="h-7 w-7 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Click to upload a file</p>
                <p className="text-xs text-gray-400">Image, PDF, or document</p>
              </div>
            ) : (
              <div className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
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
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
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
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8"
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
