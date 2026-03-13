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
import axios from "axios";
import { toast } from "sonner";

interface ConfigureFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigureFloorDialog: React.FC<ConfigureFloorDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token');
  const societyId = localStorage.getItem('selectedSocietyId');

  const [towers, setTowers] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedTower, setSelectedTower] = useState("");
  const [selectedTowerForFloors, setSelectedTowerForFloors] = useState("");
  const [floorName, setFloorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingFloors, setFetchingFloors] = useState(false);

  const fetchTowers = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setTowers(response.data?.society_blocks || []);
      setSelectedTowerForFloors(response.data?.society_blocks?.[0]?.id?.toString() || "");
    } catch (error) {
      console.error("Error fetching towers:", error);
    }
  };

  const fetchFloors = async () => {
    setFetchingFloors(true);
    try {
      const response = await axios.get(`https://${baseUrl}/society_floors.json?society_block_id=${selectedTowerForFloors}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setFloors(response.data || []);
    } catch (error) {
      console.error("Error fetching floors:", error);
    } finally {
      setFetchingFloors(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTowers();
    }
  }, [open]);

  useEffect(() => {
    fetchFloors();
  }, [selectedTowerForFloors])

  const handleSubmit = async () => {
    if (!selectedTower || !floorName.trim()) {
      toast.error("Please select a tower and enter a floor name");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`https://${baseUrl}/society_floors.json`, {
        society_floor: {
          society_block_id: selectedTower,
          name: floorName,
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      toast.success("Floor added successfully!");
      setFloorName("");
      setSelectedTower("")
      fetchFloors();
    } catch (error) {
      console.error("Error adding floor:", error);
      toast.error("Failed to add floor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Configure Floor
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tower</Label>
              <Select value={selectedTower} onValueChange={setSelectedTower}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Tower" />
                </SelectTrigger>
                <SelectContent>
                  {towers.map((tower) => (
                    <SelectItem key={tower.id} value={tower.id.toString()}>
                      {tower.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-name">Floor Name</Label>
              <Input
                id="floor-name"
                placeholder="Enter Floor Name"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Floor List</h3>
              <div className="w-60">
                <Select value={selectedTowerForFloors} onValueChange={setSelectedTowerForFloors}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tower" />
                  </SelectTrigger>
                  <SelectContent>
                    {towers.map((tower) => (
                      <SelectItem key={tower.id} value={tower.id.toString()}>
                        {tower.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Id</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tower</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Floor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fetchingFloors ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                        Loading floors...
                      </td>
                    </tr>
                  ) : floors.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                        No floors configured yet.
                      </td>
                    </tr>
                  ) : (
                    floors.map((floor) => (
                      <tr key={floor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{floor.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{floor.society_block_name || floor.society_block_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{floor.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
