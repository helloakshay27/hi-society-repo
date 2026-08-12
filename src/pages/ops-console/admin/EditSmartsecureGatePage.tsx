import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ticketManagementAPI } from "@/services/ticketManagementAPI";

interface DropdownOption {
  id: number;
  name: string;
}

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#999696ff" },
    "&.Mui-focused fieldset": { borderColor: "#C72030" },
  },
  "& .MuiInputLabel-root": {
    color: "#000000",
    "&.Mui-focused": { color: "#C72030" },
    "& .MuiInputLabel-asterisk": { color: "#ff0000 !important" },
  },
  "& .MuiFormLabel-asterisk": { color: "#ff0000 !important" },
};

const EditSmartsecureGatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const backToList = () => navigate("/ops-console/admin/smartsecure-integration");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    societyId: "",
    societyBlockId: "",
    userId: "",
    gateName: "",
    gateDevice: "",
  });

  const [societies, setSocieties] = useState<DropdownOption[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);

  const [societyBlocks, setSocietyBlocks] = useState<DropdownOption[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [users, setUsers] = useState<DropdownOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchSocieties = useCallback(async () => {
    try {
      setLoadingSocieties(true);
      const response = await ticketManagementAPI.getAdminSocieties(1, 200);
      const list = Array.isArray(response) ? response : response?.societies || [];
      setSocieties(
        list.map((s: any) => ({ id: s.id, name: s.building_name || s.name || `Society ${s.id}` }))
      );
    } catch (error) {
      console.error("Error fetching societies:", error);
      toast.error("Failed to load societies.");
      setSocieties([]);
    } finally {
      setLoadingSocieties(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await ticketManagementAPI.getEscalationUsers();
      const list = response?.users || [];
      setUsers(list.map((u: any) => ({ id: u.id, name: u.full_name || u.name })));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users.");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Loads the block list for a society. When `keepSelection` is false (the user
  // manually switched societies) the currently chosen block is cleared; when true
  // (initial prefill from the fetched gate) the existing selection is left alone.
  const loadSocietyBlocks = useCallback(async (societyId: string, keepSelection: boolean) => {
    if (!keepSelection) {
      setFormData((prev) => ({ ...prev, societyBlockId: "" }));
    }
    if (!societyId) {
      setSocietyBlocks([]);
      return;
    }
    try {
      setLoadingBlocks(true);
      const response = await ticketManagementAPI.getSocietyBlocksForSociety(societyId);
      const list = response?.society_blocks || [];
      setSocietyBlocks(list.map((b: any) => ({ id: b.id, name: b.name })));
    } catch (error) {
      console.error("Error fetching society blocks:", error);
      toast.error("Failed to load society blocks.");
      setSocietyBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  const fetchGateData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const gate = await ticketManagementAPI.getSocietyGateById(id);
      const societyId = gate?.resource_id ?? gate?.society?.id ?? "";
      const societyBlockId = gate?.society_block_id ?? gate?.society_block?.id ?? "";
      const userId = gate?.user_id ?? gate?.user?.id ?? "";

      setFormData({
        societyId: societyId ? String(societyId) : "",
        societyBlockId: societyBlockId ? String(societyBlockId) : "",
        userId: userId ? String(userId) : "",
        gateName: gate?.gate_name || "",
        gateDevice: gate?.gate_device || "",
      });

      if (societyId) {
        await loadSocietyBlocks(String(societyId), true);
      }
    } catch (error) {
      console.error("Error fetching gate data:", error);
      toast.error("Failed to load gate data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, loadSocietyBlocks]);

  useEffect(() => {
    fetchSocieties();
    fetchUsers();
    fetchGateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocietyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, societyId: value }));
    loadSocietyBlocks(value, false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.societyId) {
      toast.error("Please select a society");
      return;
    }
    if (!formData.societyBlockId) {
      toast.error("Please select a society block");
      return;
    }
    if (!formData.userId) {
      toast.error("Please select a user");
      return;
    }
    if (!formData.gateName.trim()) {
      toast.error("Please enter gate name");
      return;
    }
    if (!formData.gateDevice.trim()) {
      toast.error("Please enter gate device");
      return;
    }

    const payload = {
      gate_name: formData.gateName.trim(),
      gate_device: formData.gateDevice.trim(),
      resource_id: parseInt(formData.societyId, 10),
      society_block_id: parseInt(formData.societyBlockId, 10),
      user_id: parseInt(formData.userId, 10),
    };

    setSubmitting(true);
    try {
      await ticketManagementAPI.updateSmartsecureGate(id!, payload);
      toast.success("Gate updated successfully!");
      backToList();
    } catch (error) {
      console.error("Error updating smartsecure gate:", error);
      toast.error("Failed to update gate. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p>Loading gate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={backToList}
            className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#F2EEE9] border-b border-gray-200 flex items-center">
              <div className="w-8 h-8 bg-[#C72030] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                1
              </div>
              <h2 className="text-lg font-semibold text-gray-900">GATE CONFIGURATION</h2>
            </div>
            <div className="p-6 space-y-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                  <InputLabel shrink required>Society</InputLabel>
                  <MuiSelect
                    value={formData.societyId}
                    onChange={(e) => handleSocietyChange(e.target.value)}
                    label="Society"
                    notched
                    displayEmpty
                    disabled={loadingSocieties}
                  >
                    <MenuItem value="">
                      {loadingSocieties ? "Loading societies..." : "Select Society"}
                    </MenuItem>
                    {societies.map((society) => (
                      <MenuItem key={society.id} value={society.id.toString()}>
                        {society.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                  <InputLabel shrink required>Society Block</InputLabel>
                  <MuiSelect
                    value={formData.societyBlockId}
                    onChange={(e) => handleInputChange("societyBlockId", e.target.value)}
                    label="Society Block"
                    notched
                    displayEmpty
                    disabled={!formData.societyId || loadingBlocks}
                  >
                    <MenuItem value="">
                      {!formData.societyId
                        ? "Select a society first"
                        : loadingBlocks
                        ? "Loading blocks..."
                        : "Select Society Block"}
                    </MenuItem>
                    {societyBlocks.map((block) => (
                      <MenuItem key={block.id} value={block.id.toString()}>
                        {block.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                  <InputLabel shrink required>User</InputLabel>
                  <MuiSelect
                    value={formData.userId}
                    onChange={(e) => handleInputChange("userId", e.target.value)}
                    label="User"
                    notched
                    displayEmpty
                    disabled={loadingUsers}
                  >
                    <MenuItem value="">
                      {loadingUsers ? "Loading users..." : "Select User"}
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Gate Name"
                  placeholder="Enter gate name"
                  value={formData.gateName}
                  onChange={(e) => handleInputChange("gateName", e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true, required: true }}
                  sx={fieldStyles}
                />
                <TextField
                  label="Gate Device"
                  placeholder="Enter gate device"
                  value={formData.gateDevice}
                  onChange={(e) => handleInputChange("gateDevice", e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true, required: true }}
                  sx={fieldStyles}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={submitting}
              className="px-12 py-3 bg-[#C72030] hover:bg-[#A01928] text-white font-medium disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSmartsecureGatePage;
