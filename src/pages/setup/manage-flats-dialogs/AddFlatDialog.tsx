import React, { useEffect, useState } from "react";
import { X, Upload } from "lucide-react";
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
  const [formData, setFormData] = useState({
    status: true,
    possession: true,
    sold: false,
    tower: "",
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

  const fetchTowers = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks.json?society_id=${localStorage.getItem('selectedSocietyId')}`, {
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
    fetchTowers()
    fetchFlatTypes()
    fetchRmUsers()
  }, [])

  useEffect(() => {
    if (formData.tower) {
      fetchFloors()
    }
  }, [formData.tower])

  const onChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      society_flat: {
        society_block_id: formData.tower,
        society_floor_id: formData.floor,
        flat_no: formData.flat,
        build_up_area: formData.carpetArea,
        super_area: formData.builtUpArea,
        society_flat_type_id: formData.flatType,
        occupancy: formData.occupied,
        bill_to_party: formData.nameOnBill,
        date_of_possession: formData.dateOfPossession,
        rm_user_id: formData.rmUser,
        possession: formData.possession,
        sold: formData.sold,
        approve: formData.status,
      },
      society_id: localStorage.getItem('selectedSocietyId')
    }
    setLoading(true)
    try {
      await axios.post(`https://${baseUrl}/crm/admin/society_flats.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success("Flat added successfully!")
      fetchFlats()
      onOpenChange(false)
      setFormData({
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

          {/* Tower and Flat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="tower" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Tower <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tower}
                onValueChange={(value) => onChange('tower', value)}
              >
                <SelectTrigger id="tower" className="border border-gray-400 pt-2">
                  <SelectValue placeholder="Select Tower" />
                </SelectTrigger>
                <SelectContent>
                  {towerOptions.map((tower) => (
                    <SelectItem key={tower.id} value={tower.id.toString()}>{tower.name}</SelectItem>
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
              <Label htmlFor="flat" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">
                Flat <span className="text-red-500">*</span>
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
              <Label htmlFor="flatType" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Flat Type</Label>
              <Select
                value={formData.flatType}
                onValueChange={(value) => onChange('flatType', value)}
              >
                <SelectTrigger id="flatType" className="border border-gray-400 pt-2">
                  <SelectValue placeholder="Select Flat Type" />
                </SelectTrigger>
                <SelectContent>
                  {flatTypeOptions.map((flatType) => (
                    <SelectItem key={flatType.id} value={flatType.id.toString()}>{flatType.society_flat_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Label htmlFor="occupied" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Occupied</Label>
              <Select
                value={formData.occupied}
                onValueChange={(value) => onChange('occupied', value)}
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
              />
            </div>

            {/* Rm User */}
            <div className="relative">
              <Label htmlFor="rmUser" className="absolute left-2 -top-2.5 text-xs font-medium text-gray-600 bg-white px-2 z-10">Rm User</Label>
              <Select
                value={formData.rmUser}
                onValueChange={(value) => onChange('rmUser', value)}
              >
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
            </div>
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

          {/* Attachment Documents */}
          {/* <div className="space-y-3 pt-4 border-t">
            <h3 className="text-base font-semibold">Attachment Documents</h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                multiple
              />
              <Label
                htmlFor="fileUpload"
                className="cursor-pointer inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Upload className="h-4 w-4" />
                Choose a file...
              </Label>
            </div>
            <Button
              onClick={() => document.getElementById('fileUpload')?.click()}
              className="w-fit"
            >
              upload
            </Button>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
