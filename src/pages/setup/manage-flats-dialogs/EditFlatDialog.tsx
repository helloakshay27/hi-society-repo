import React, { useEffect, useState, useRef } from "react";
import { X, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axios from "axios";

interface EditFlatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchFlats: () => void;
  flatId: string | null;
}

export const EditFlatDialog: React.FC<EditFlatDialogProps> = ({
  open,
  onOpenChange,
  fetchFlats,
  flatId,
}) => {
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [towerOptions, setTowerOptions] = useState<any[]>([]);
  const [floorOptions, setFloorOptions] = useState([])
  const [flatTypeOptions, setFlatTypeOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [rmUsers, setRmUsers] = useState([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    status: true,
    possession: true,
    sold: false,
    tower: "",
    floor: "",
    flat: "",
    carpetArea: "",
    builtUpArea: "",
    flatType: "",
    occupied: "",
    nameOnBill: "",
    dateOfPossession: "",
    rmUser: "",
  });

  const fetchTowers = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/society_blocks.json?society_id=${localStorage.getItem(
          "selectedSocietyId"
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTowerOptions(response.data.society_blocks);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch towers");
    }
  };

  const fetchFloors = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/society_floors.json?society_block_id=${formData.tower}`, {
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
          Authorization: `Bearer ${token}`,
        },
      });
      setFlatTypeOptions(response.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch flat types");
    }
  };

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

  const fetchFlatDetails = async (id: string) => {
    setFetching(true);
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_flats/${id}.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const flat = response.data;
      setFormData({
        status: flat.approve || false,
        possession: flat.possession || false,
        sold: flat.sold || false,
        tower: flat.society_block_id?.toString() || "",
        floor: flat.society_floor_id?.toString() || "",
        flat: flat.flat_no || "",
        carpetArea: flat.build_up_area?.toString() || "",
        builtUpArea: flat.super_area?.toString() || "",
        flatType: flat.society_flat_type_id?.toString() || "",
        occupied: flat.occupancy || "",
        nameOnBill: flat.bill_to_party || "",
        dateOfPossession: flat?.date_of_possession?.split("T")[0] || "",
        rmUser: flat.rm_user_id || "",
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch flat details");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTowers();
      fetchFlatTypes();
      fetchRmUsers()
      if (flatId) {
        fetchFlatDetails(flatId);
      }
    }
  }, [open, flatId]);

  useEffect(() => {
    if (formData.tower) {
      fetchFloors()
    }
  }, [formData.tower])

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

  const onChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!flatId) return;

    setLoading(true);
    const fd = new FormData();
    fd.append("society_flat[society_block_id]", formData.tower);
    fd.append("society_flat[society_floor_id]", formData.floor);
    fd.append("society_flat[flat_no]", formData.flat);
    fd.append("society_flat[build_up_area]", formData.carpetArea);
    fd.append("society_flat[super_area]", formData.builtUpArea);
    fd.append("society_flat[society_flat_type_id]", formData.flatType);
    fd.append("society_flat[occupancy]", formData.occupied);
    fd.append("society_flat[bill_to_party]", formData.nameOnBill);
    fd.append("society_flat[date_of_possession]", formData.dateOfPossession);
    if (formData.rmUser) fd.append("society_flat[rm_user_id]", formData.rmUser);
    fd.append("society_flat[possession]", String(formData.possession));
    fd.append("society_flat[sold]", String(formData.sold));
    fd.append("society_flat[approve]", String(formData.status));
    fd.append("society_id", localStorage.getItem("selectedSocietyId") || "");
    if (attachment) fd.append("society_flat[file]", attachment);

    try {
      await axios.put(`https://${baseUrl}/crm/admin/society_flats/${flatId}.json`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Flat updated successfully!");
      fetchFlats();
      onOpenChange(false);
      if (preview) URL.revokeObjectURL(preview);
      setAttachment(null);
      setPreview("");
    } catch (error) {
      console.log(error);
      toast.error("Failed to update flat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Edit Flat</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {fetching ? (
          <div className="p-10 text-center">Loading flat details...</div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status:
                </Label>
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => onChange("status", checked)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="possession" className="text-sm font-medium">
                  Possession:
                </Label>
                <Switch
                  id="possession"
                  checked={formData.possession}
                  onCheckedChange={(checked) => onChange("possession", checked)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sold" className="text-sm font-medium">
                  Sold:
                </Label>
                <Switch
                  id="sold"
                  checked={formData.sold}
                  onCheckedChange={(checked) => onChange("sold", checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label
                  htmlFor="tower"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Tower <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.tower} onValueChange={(value) => onChange("tower", value)}>
                  <SelectTrigger id="tower" className="border border-gray-400 pt-2">
                    <SelectValue placeholder="Select Tower" />
                  </SelectTrigger>
                  <SelectContent>
                    {towerOptions.map((tower) => (
                      <SelectItem key={tower.id} value={tower.id.toString()}>
                        {tower.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Label htmlFor="floor" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                  Floor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.floor}
                  onValueChange={(value) => onChange('floor', value)}
                >
                  <SelectTrigger id="floor" className="border border-gray-400 pt-2">
                    <SelectValue placeholder="Select Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floorOptions.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id.toString()}>{floor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Label
                  htmlFor="flat"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Flat <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="flat"
                  placeholder=" "
                  value={formData.flat}
                  onChange={(e) => onChange("flat", e.target.value)}
                  className="border border-gray-400"
                />
              </div>

              <div className="relative">
                <Label
                  htmlFor="carpetArea"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Carpet Area
                </Label>
                <Input
                  id="carpetArea"
                  placeholder=" "
                  value={formData.carpetArea}
                  onChange={(e) => onChange("carpetArea", e.target.value)}
                  className="border border-gray-400"
                />
              </div>

              <div className="relative">
                <Label
                  htmlFor="builtUpArea"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Built up Area
                </Label>
                <Input
                  id="builtUpArea"
                  placeholder=" "
                  value={formData.builtUpArea}
                  onChange={(e) => onChange("builtUpArea", e.target.value)}
                  className="border border-gray-400"
                />
              </div>

              <div className="relative">
                <Label
                  htmlFor="flatType"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Flat Type
                </Label>
                <Select
                  value={formData.flatType}
                  onValueChange={(value) => onChange("flatType", value)}
                >
                  <SelectTrigger id="flatType" className="border border-gray-400 pt-2">
                    <SelectValue placeholder="Select Flat Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatTypeOptions.map((flatType) => (
                      <SelectItem key={flatType.id} value={flatType.id.toString()}>
                        {flatType.society_flat_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Label
                  htmlFor="occupied"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Occupied
                </Label>
                <Select
                  value={formData.occupied}
                  onValueChange={(value) => onChange("occupied", value)}
                >
                  <SelectTrigger id="occupied" className="border border-gray-400 pt-2">
                    <SelectValue placeholder="Please Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Label
                  htmlFor="nameOnBill"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Name on Bill
                </Label>
                <Input
                  id="nameOnBill"
                  placeholder=" "
                  value={formData.nameOnBill}
                  onChange={(e) => onChange("nameOnBill", e.target.value)}
                  className="border border-gray-400"
                />
              </div>

              <div className="relative">
                <Label
                  htmlFor="dateOfPossession"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Date of possession
                </Label>
                <Input
                  id="dateOfPossession"
                  type="date"
                  placeholder=" "
                  value={formData.dateOfPossession}
                  onChange={(e) => onChange("dateOfPossession", e.target.value)}
                  className="border border-gray-400"
                />
              </div>

              {/* <div className="relative">
                <Label
                  htmlFor="rmUser"
                  className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10"
                >
                  Rm User
                </Label>
                <Select value={formData.rmUser} onValueChange={(value) => onChange("rmUser", value)}>
                  <SelectTrigger id="rmUser" className="border border-gray-400 pt-2">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {
                      rmUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div> */}
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

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8"
              >
                {loading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
