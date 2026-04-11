import React, { useEffect, useState } from "react";
import { X, Check, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface ConfigureTowerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTower: number | null;
  setEditingTower: (id: number | null) => void;
}

export const ConfigureTowerDialog: React.FC<ConfigureTowerDialogProps> = ({
  open,
  onOpenChange,
  editingTower,
  setEditingTower,
}) => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token');

  const [towers, setTowers] = useState([]);
  const [newTowerName, setNewTowerName] = useState("");
  const [newTowerAbbreviation, setNewTowerAbbreviation] = useState("");
  const [editedTowerData, setEditedTowerData] = useState({ name: "", abbreviation: "" });
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchConfiguredTowers = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      setTowers(response.data?.society_blocks?.reverse())
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchConfiguredTowers()
  }, [])

  const handleToggleTowerStatus = async (tower: any) => {
    const newStatus = !tower.status;

    // Optimistic update
    setTowers((prev: any[]) =>
      prev.map((t) => t.id === tower.id ? { ...t, status: newStatus } : t)
    );

    try {
      await axios.put(`https://${baseUrl}/crm/admin/society_blocks/${tower.id}.json`, {
        society_block: {
          name: tower.name,
          description: tower.description,
          status: newStatus ? 1 : 0,
        },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      toast.success(`Tower ${newStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      console.log(error);
      // Revert on failure
      setTowers((prev: any[]) =>
        prev.map((t) => t.id === tower.id ? { ...t, status: tower.status } : t)
      );
      toast.error("Failed to update tower status");
    }
  };

  const handleSubmitTower = async () => {
    if (!newTowerName.trim() || !newTowerAbbreviation.trim()) {
      toast.error("Please fill in both Tower Name and Abbreviation");
      return;
    }

    setIsSubmitting(true)
    try {
      await axios.post(`https://${baseUrl}/crm/admin/society_blocks.json`, {
        society_block: {
          name: newTowerName,
          description: newTowerAbbreviation,
          status: 1,
          active: 1,
        },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      toast.success("Tower added successfully!")
      setNewTowerName("")
      setNewTowerAbbreviation("")
      fetchConfiguredTowers()
    } catch (error) {
      console.log(error)
    } finally {
      setIsSubmitting(false)
    }
  };

  const handleSaveTowerEdit = async (tower: any) => {
    if (!editedTowerData.name.trim()) {
      toast.error("Tower name cannot be empty");
      return;
    }

    try {
      await axios.put(`https://${baseUrl}/crm/admin/society_blocks/${tower.id}.json`, {
        society_block: {
          name: editedTowerData.name,
          description: editedTowerData.abbreviation,
          status: tower.status,
        },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      toast.success("Tower updated successfully!");
      setEditingTower(null);
      setEditedTowerData({ name: "", abbreviation: "" });
      fetchConfiguredTowers();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update tower");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Configure Tower
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
          {/* Add New Tower Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tower-name">Tower Name <span className="text-red-500">*</span></Label>
              <Input
                id="tower-name"
                placeholder="Enter Tower Name"
                value={newTowerName}
                onChange={(e) => setNewTowerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tower-abbreviation">Abbreviation <span className="text-red-500">*</span></Label>
              <Input
                id="tower-abbreviation"
                placeholder="Enter Abbreviation"
                value={newTowerAbbreviation}
                onChange={(e) => setNewTowerAbbreviation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button
              onClick={handleSubmitTower}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>

          {/* Tower List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tower List</h3>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Id
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Tower
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Abbreviation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {towers.map((tower) => (
                    <tr key={tower.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tower.id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingTower === tower.id ? (
                          <Input
                            value={editedTowerData.name}
                            onChange={(e) =>
                              setEditedTowerData({ ...editedTowerData, name: e.target.value })
                            }
                            className="w-full"
                          />
                        ) : (
                          <div>
                            <div className="text-gray-900 font-medium">{tower.name || "-"}</div>
                            {tower.createdBy && (
                              <div className="text-xs text-gray-500">Created By - {tower.createdBy}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingTower === tower.id ? (
                          <Input
                            value={editedTowerData.abbreviation}
                            onChange={(e) =>
                              setEditedTowerData({ ...editedTowerData, abbreviation: e.target.value })
                            }
                            className="w-full"
                          />
                        ) : (
                          <span className="text-gray-900">{tower.description || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-left">
                        {/* <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#C72030] cursor-pointer"
                          checked={!!tower.status}
                          onChange={() => handleToggleTowerStatus(tower)}
                          title={tower.status ? "Active" : "Inactive"}
                        /> */}
                        <Checkbox
                          checked={!!tower.status}
                          onCheckedChange={() => handleToggleTowerStatus(tower)}
                          className="data-[state=checked]:bg-[#C72030] data-[state=checked]:border-[#C72030]"
                          title={tower.status ? "Active" : "Inactive"}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingTower === tower.id ? (
                          <button
                            onClick={() => handleSaveTowerEdit(tower)}
                            className="text-green-600 hover:text-green-800 inline-flex items-center justify-center"
                            title="Save"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTower(tower.id);
                              setEditedTowerData({
                                name: tower.name,
                                abbreviation: tower.description,
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
