import React, { useEffect, useState } from "react";
import { X, Check, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/SearchSelect";
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

interface ConfigureWingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigureWingDialog: React.FC<ConfigureWingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const savedUrl = localStorage.getItem("baseUrl");
  const baseUrl = savedUrl
    ? savedUrl.startsWith("http")
      ? savedUrl
      : `https://${savedUrl}`
    : "";
  const token = localStorage.getItem("token");
  const societyId = localStorage.getItem("selectedSocietyId");

  const [projects, setProjects] = useState<any[]>([]);
  const [towers, setTowers] = useState<any[]>([]);
  const [wings, setWings] = useState<any[]>([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTower, setSelectedTower] = useState("");

  const [selectedProjectForWings, setSelectedProjectForWings] = useState("");
  const [selectedTowerForWings, setSelectedTowerForWings] = useState("");

  const [wingName, setWingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingWings, setFetchingWings] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${baseUrl}/crm/builder_projects/dropdown_projects.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const raw = response.data;
      if (Array.isArray(raw?.builder_projects)) setProjects(raw.builder_projects);
      else if (Array.isArray(raw)) setProjects(raw);
      else if (Array.isArray(raw?.projects)) setProjects(raw.projects);
      else setProjects([]);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchTowers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}&q[active_eq]=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setTowers(response.data?.society_blocks || []);
    } catch (error) {
      console.error("Error fetching towers:", error);
    }
  };

  const fetchWings = async () => {
    if (!selectedTowerForWings) {
      setWings([]);
      return;
    }
    setFetchingWings(true);
    try {
      const response = await axios.get(`${baseUrl}/wings.json?tower_id=${selectedTowerForWings}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setWings(response.data || []);
    } catch (error) {
      console.error("Error fetching wings:", error);
    } finally {
      setFetchingWings(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchTowers();
    }
  }, [open]);

  useEffect(() => {
    fetchWings();
  }, [selectedTowerForWings]);

  const filteredTowers = towers.filter((t) => !selectedProject || t.project_id?.toString() === selectedProject);
  const filteredTowersForWings = towers.filter((t) => !selectedProjectForWings || t.project_id?.toString() === selectedProjectForWings);

  const handleSubmit = async () => {
    if (!selectedTower || !wingName.trim()) {
      toast.error("Please select a tower and enter a wing name");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${baseUrl}/create_wing.json`, {
        tower_id: selectedTower,
        wing: wingName,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      toast.success("Wing configured successfully!");
      setWingName("");
      setSelectedTower("");
      if (selectedTowerForWings === selectedTower) {
        fetchWings();
      }
    } catch (error: any) {
      console.error("Error configuring wing:", error);
      toast.error(error.response?.data?.message || "Failed to configure wing");
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
              Configure Wing
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <SearchableSelect
                value={selectedProject}
                onChange={(value) => {
                  setSelectedProject(value);
                  setSelectedTower("");
                }}
                options={projects.map((p: any) => ({
                  value: p.id.toString(),
                  label: p.name || p.project_name,
                }))}
                placeholder="Select Project"
                className=""
              />
            </div>
            <div className="space-y-2">
              <Label>Tower <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={selectedTower}
                onChange={setSelectedTower}
                options={filteredTowers.map((tower) => ({
                  value: tower.id.toString(),
                  label: tower.name,
                }))}
                placeholder="Select Tower"
                className=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wing-name">Wing Name <span className="text-red-500">*</span></Label>
              <Input
                id="wing-name"
                placeholder="Enter Wing Name"
                value={wingName}
                onChange={(e) => setWingName(e.target.value)}
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
              <h3 className="text-lg font-semibold">Wing List</h3>
              <div className="flex items-center gap-2">
                <div className="w-48">
                  <SearchableSelect
                    value={selectedProjectForWings}
                    onChange={(value) => {
                      setSelectedProjectForWings(value);
                      setSelectedTowerForWings("");
                    }}
                    options={[
                      { value: "", label: "All Projects" },
                      ...projects.map((p: any) => ({
                        value: p.id.toString(),
                        label: p.name || p.project_name,
                      })),
                    ]}
                    placeholder="All Projects"
                    className=""
                  />
                </div>
                <div className="w-48">
                  <SearchableSelect
                    value={selectedTowerForWings}
                    onChange={setSelectedTowerForWings}
                    options={filteredTowersForWings.map((tower) => ({
                      value: tower.id.toString(),
                      label: tower.name,
                    }))}
                    placeholder="Select Tower"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Id</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tower ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Wing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fetchingWings ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                        Loading wings...
                      </td>
                    </tr>
                  ) : wings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                        No wings found or endpoint not available.
                      </td>
                    </tr>
                  ) : (
                    wings.map((w: any) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{w.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{w.tower_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{w.wing}</td>
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
