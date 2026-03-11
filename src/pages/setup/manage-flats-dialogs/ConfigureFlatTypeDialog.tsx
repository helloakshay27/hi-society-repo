import React, { useEffect, useState } from "react";
import { X, Check, Edit2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import axios from "axios";

interface FlatType {
  id: number;
  society_flat_type: string;
  appartment_type: string;
  active: boolean;
}

interface ConfigureFlatTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigureFlatTypeDialog: React.FC<ConfigureFlatTypeDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token');

  const [newFlatType, setNewFlatType] = useState("");
  const [newConfiguration, setNewConfiguration] = useState("");
  const [newApartmentType, setNewApartmentType] = useState("");
  const [editingFlatType, setEditingFlatType] = useState<number | null>(null);
  const [editedFlatTypeData, setEditedFlatTypeData] = useState({ society_flat_type: "", appartment_type: "" });
  const [flatTypes, setFlatTypes] = useState<FlatType[]>([]);

  const fetchConfiguredFlatTypes = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/flat_types.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      setFlatTypes(response.data);
    } catch (error) {
      console.error("Error fetching configured flat types:", error);
    }
  };

  useEffect(() => {
    fetchConfiguredFlatTypes();
  }, []);

  const handleSubmitFlatType = async () => {
    if (!newFlatType.trim()) {
      toast.error("Please enter a flat/unit type");
      return;
    }
    if (!newApartmentType) {
      toast.error("Please select an apartment type");
      return;
    }

    try {
      await axios.post(`https://${baseUrl}/crm/flat_types.json`, {
        flat_type: {
          society_flat_type: newFlatType,
          flat: newConfiguration,
          appartment_type: newApartmentType,
          status: true,
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      setNewFlatType("");
      setNewConfiguration("");
      setNewApartmentType("");
      toast.success("Flat type configured successfully.")
      fetchConfiguredFlatTypes()
    } catch (error) {
      console.error("Error fetching configured flat types:", error);
    }
  };

  const handleToggleFlatTypeStatus = (id: number) => {
    setFlatTypes(
      flatTypes.map((ft) =>
        ft.id === id ? { ...ft, active: !ft.active } : ft
      )
    );
  };

  const handleSaveEdit = async (id: number) => {
    if (!editedFlatTypeData.society_flat_type.trim()) {
      toast.error("Flat type name cannot be empty");
      return;
    }

    try {
      await axios.put(`https://${baseUrl}/crm/flat_types/${id}.json`, {
        flat_type: {
          society_flat_type: editedFlatTypeData.society_flat_type,
          appartment_type: editedFlatTypeData.appartment_type,
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      toast.success("Flat type updated successfully!");
      setEditingFlatType(null);
      setEditedFlatTypeData({ society_flat_type: "", appartment_type: "" });
      fetchConfiguredFlatTypes();
    } catch (error) {
      console.error("Error updating flat type:", error);
      toast.error("Failed to update flat type");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Configure Flat Type
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6 px-6">
          {/* Add New Flat Type Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flat-type">Flat/Unit Type</Label>
              <Input
                id="flat-type"
                placeholder="Enter Flat Type"
                value={newFlatType}
                onChange={(e) => setNewFlatType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configuration">Configuration</Label>
              <Select value={newConfiguration} onValueChange={setNewConfiguration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RK">RK</SelectItem>
                  <SelectItem value="BHK">BHK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apartment-type">Apartment Type</Label>
            <Select value={newApartmentType} onValueChange={setNewApartmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Penthouse">Penthouse</SelectItem>
                <SelectItem value="Duplex">Duplex</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Row House">Row House</SelectItem>
                <SelectItem value="Compact">Compact</SelectItem>
                <SelectItem value="Compact Duplex">Compact Duplex</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-start">
            <Button
              onClick={handleSubmitFlatType}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit
            </Button>
          </div>

          {/* Flat/Unit Type List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Flat/Unit Type List</h3>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Id
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Flat/Unit Type
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Apartment Type
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {flatTypes.map((flatType) => (
                    <tr key={flatType.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {flatType.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {editingFlatType === flatType.id ? (
                          <Input
                            value={editedFlatTypeData.society_flat_type}
                            onChange={(e) =>
                              setEditedFlatTypeData({ ...editedFlatTypeData, society_flat_type: e.target.value })
                            }
                            className="w-full"
                          />
                        ) : (
                          flatType.society_flat_type
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {editingFlatType === flatType.id ? (
                          <Select
                            value={editedFlatTypeData.appartment_type}
                            onValueChange={(val) => setEditedFlatTypeData({ ...editedFlatTypeData, appartment_type: val })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Apartment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Apartment">Apartment</SelectItem>
                              <SelectItem value="Penthouse">Penthouse</SelectItem>
                              <SelectItem value="Duplex">Duplex</SelectItem>
                              <SelectItem value="Villa">Villa</SelectItem>
                              <SelectItem value="Row House">Row House</SelectItem>
                              <SelectItem value="Compact">Compact</SelectItem>
                              <SelectItem value="Compact Duplex">Compact Duplex</SelectItem>
                              <SelectItem value="Studio">Studio</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-500">
                            {flatType.appartment_type || "Select Apartment"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={flatType.active}
                            onCheckedChange={() => handleToggleFlatTypeStatus(flatType.id)}
                            className="h-5 w-5"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingFlatType === flatType.id ? (
                          <button
                            onClick={() => handleSaveEdit(flatType.id)}
                            className="text-green-600 hover:text-green-800 inline-flex items-center justify-center"
                            title="Save"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingFlatType(flatType.id);
                              setEditedFlatTypeData({
                                society_flat_type: flatType.society_flat_type,
                                appartment_type: flatType.appartment_type,
                              });
                            }}
                            className="text-gray-600 hover:text-gray-800 inline-flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
