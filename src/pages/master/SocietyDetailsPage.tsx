import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { Society } from "@/types/society";

interface SocietyBlock {
  id: number;
  name: string;
  description: string;
  status: number;
  active: number;
  created_by: number;
  society_id: number;
  project_id: number | null;
  created_at: string;
  updated_at: string;
}

export const SocietyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("details");

  // Blocks state
  const [blocks, setBlocks] = useState<SocietyBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockFormData, setBlockFormData] = useState({ name: "", description: "", active: true });
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const fetchSocietyDetails = async (societyId: number) => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/societies/${societyId}.json?token=${token}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Society not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const societyData = data.society || data.data || data;
      setSociety(societyData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching society details:", error);
      setError(errorMessage);
      toast.error(`Failed to load society details: ${errorMessage}`, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Blocks CRUD ─────────────────────────────────────────────────────────────

  const fetchBlocks = async () => {
    if (!id) return;
    setBlocksLoading(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/society_blocks.json?society_id=${id}&token=${token}`;
      const response = await fetch(url, { headers: { "Content-Type": "application/json" } });
      const data = await response.json();
      setBlocks(Array.isArray(data.society_blocks) ? data.society_blocks.filter((b: SocietyBlock) => b.active === 1) : []);
    } catch (err) {
      console.error("fetchBlocks failed:", err);
      toast.error("Failed to load blocks.");
    } finally {
      setBlocksLoading(false);
    }
  };

  const openAddBlock = () => {
    setEditingBlockId(null);
    setBlockFormData({ name: "", description: "", active: true });
    setBlockModalOpen(true);
  };

  const handleCreateBlock = async () => {
    if (!blockFormData.name.trim()) {
      toast.error("Block name is required.");
      return;
    }
    if (!id) return;
    setBlockSubmitting(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/society_blocks.json?token=${token}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          society_block: {
            name: blockFormData.name.trim(),
            description: blockFormData.description.trim(),
            active: blockFormData.active ? 1 : 0,
            society_id: parseInt(id),
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to create block");
      toast.success("Block created successfully.");
      setBlockModalOpen(false);
      fetchBlocks();
    } catch (err) {
      console.error("handleCreateBlock failed:", err);
      toast.error("Failed to create block.");
    } finally {
      setBlockSubmitting(false);
    }
  };

  const openEditBlock = async (block: SocietyBlock) => {
    setEditingBlockId(block.id);
    setBlockSubmitting(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/society_blocks/${block.id}.json?token=${token}`;
      const response = await fetch(url, { headers: { "Content-Type": "application/json" } });
      const data = await response.json();
      const b = data.society_block || data;
      setBlockFormData({
        name: b.name ?? "",
        description: b.description ?? "",
        active: b.active === 1,
      });
      setBlockModalOpen(true);
    } catch (err) {
      console.error("openEditBlock failed:", err);
      toast.error("Failed to load block details.");
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleUpdateBlock = async () => {
    if (!blockFormData.name.trim()) {
      toast.error("Block name is required.");
      return;
    }
    if (editingBlockId === null) return;
    setBlockSubmitting(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/society_blocks/${editingBlockId}.json?token=${token}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          society_block: {
            name: blockFormData.name.trim(),
            description: blockFormData.description.trim(),
            active: blockFormData.active ? 1 : 0,
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to update block");
      toast.success("Block updated successfully.");
      setBlockModalOpen(false);
      setEditingBlockId(null);
      fetchBlocks();
    } catch (err) {
      console.error("handleUpdateBlock failed:", err);
      toast.error("Failed to update block.");
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: number) => {
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/society_blocks/${blockId}.json?token=${token}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete block");
      toast.success("Block deleted successfully.");
      fetchBlocks();
    } catch (err) {
      console.error("handleDeleteBlock failed:", err);
      toast.error("Failed to delete block.");
    }
  };

  useEffect(() => {
    if (id) {
      fetchSocietyDetails(parseInt(id));
      fetchBlocks();
    }
  }, [id]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const amenities = [
    { label: "Lift", value: society?.lift_av },
    { label: "Gym", value: society?.gym_av },
    { label: "Swimming Pool", value: society?.swimming_pool },
    { label: "Gas Pipeline", value: society?.gas_pipeline },
    { label: "Garden", value: society?.garden },
    { label: "Kids Play Area", value: society?.kids_play_area },
    { label: "Club House", value: society?.club_house },
    { label: "Community Hall", value: society?.community_hall },
    { label: "Temple", value: society?.temple },
  ].filter((a) => a.value !== null && a.value !== undefined);

  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#C72030]" />
          <p className="text-gray-600">Loading society details...</p>
        </div>
      </div>
    );
  }

  if (error || !society) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Society Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The requested society could not be found."}
          </p>
          <Button
            onClick={() => navigate("/ops-console/master/location/account")}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Societies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/ops-console/master/location/account")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account Management
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {society.building_name || `Society #${society.id}`}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    society.active === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {society.active === 1 ? "Active" : "Inactive"}
                </span>
                {society.test_project && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Test Project
                  </span>
                )}
                {society.approve === 1 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Approved
                  </span>
                )}
                {society.project_type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {society.project_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="details" className="data-[state=active]:bg-[#C72030] data-[state=active]:text-white px-6 py-2">
              Society Details
            </TabsTrigger>
            <TabsTrigger value="blocks" className="data-[state=active]:bg-[#C72030] data-[state=active]:text-white px-6 py-2">
              Blocks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#C72030]" />
                    Basic Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Society ID
                        </label>
                        <p className="text-gray-900 font-mono">#{society.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Society Name
                        </label>
                        <p className="text-gray-900">{society.building_name || "N/A"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration
                        </label>
                        <p className="text-gray-900">{society.registration || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <p className="text-gray-900">{society.description || "N/A"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Established
                        </label>
                        <p className="text-gray-900">{society.established || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Residents
                        </label>
                        <p className="text-gray-900">{society.residents || "N/A"}</p>
                      </div>
                    </div>
                    {society.soc_office_timing && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Office Timing
                        </label>
                        <p className="text-gray-900">{society.soc_office_timing}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#C72030]" />
                    Location Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <p className="text-gray-900">{society.address1 || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <p className="text-gray-900">{society.address2 || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area
                      </label>
                      <p className="text-gray-900">{society.area || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <p className="text-gray-900">{society.city || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <p className="text-gray-900">{society.state || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <p className="text-gray-900">{society.country || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postcode
                      </label>
                      <p className="text-gray-900 font-mono">{society.postcode || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Type
                      </label>
                      <p className="text-gray-900">{society.project_type || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Billing Information Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#C72030]" />
                    Billing Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Rate
                      </label>
                      <p className="text-gray-900">
                        {society.billing_rate ? `₹${society.billing_rate}` : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Term
                      </label>
                      <p className="text-gray-900">
                        {society.billing_term || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Cycle
                      </label>
                      <p className="text-gray-900">
                        {society.billing_cycle || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill To
                      </label>
                      <p className="text-gray-900">
                        {society.bill_to || "Not specified"}
                      </p>
                    </div>
                  </div>
                  {(society.start_date || society.end_date) && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {society.start_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <p className="text-gray-900">
                            {new Date(society.start_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                      {society.end_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <p className="text-gray-900">
                            {new Date(society.end_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Meta Information */}
              <div className="space-y-6">
                {/* Images Card */}
                {society.images && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#C72030]" />
                      Society Images
                    </h2>
                    <div className="space-y-4">
                      {society.images.logo && (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Logo</h3>
                          <img
                            src={society.images.logo}
                            alt="Society Logo"
                            className="w-32 h-32 object-contain border rounded shadow bg-white"
                          />
                        </div>
                      )}
                      {society.images.splash && (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Splash Image</h3>
                          <img
                            src={society.images.splash}
                            alt="Society Splash"
                            className="w-full max-w-xs h-32 object-contain border rounded shadow bg-white"
                          />
                        </div>
                      )}
                      {society.images.scheduler_logo && (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Scheduler Logo</h3>
                          <img
                            src={society.images.scheduler_logo}
                            alt="Scheduler Logo"
                            className="w-32 h-32 object-contain border rounded shadow bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Super Society / Project Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Project Information
                  </h2>
                  <div className="space-y-3">
                    {society.super_society && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Super Society
                        </label>
                        <p className="text-gray-900">
                          {society.super_society.name || `ID: ${society.super_society.id}`}
                        </p>
                      </div>
                    )}
                    {society.company_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company ID
                        </label>
                        <p className="text-gray-900 font-mono">#{society.company_id}</p>
                      </div>
                    )}
                    {society.builder_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Builder ID
                        </label>
                        <p className="text-gray-900 font-mono">#{society.builder_id}</p>
                      </div>
                    )}
                    {society.headquarter_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Headquarter ID
                        </label>
                        <p className="text-gray-900 font-mono">#{society.headquarter_id}</p>
                      </div>
                    )}
                    {society.region_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Region ID
                        </label>
                        <p className="text-gray-900 font-mono">#{society.region_id}</p>
                      </div>
                    )}
                    {society.zone_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zone ID
                        </label>
                        <p className="text-gray-900 font-mono">#{society.zone_id}</p>
                      </div>
                    )}
                    {society.no_of_devices && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. of Devices
                        </label>
                        <p className="text-gray-900">{society.no_of_devices}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Approval Information
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">
                        Approved
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          society.approve === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {society.approve === 1 ? "Yes" : "No"}
                      </span>
                    </div>
                    {society.approved_by && society.approved_by.name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approved By
                        </label>
                        <p className="text-gray-900">{society.approved_by.name}</p>
                      </div>
                    )}
                    {society.approved_on && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approved On
                        </label>
                        <p className="text-gray-900">{formatDate(society.approved_on)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* IVR Information Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    IVR Configuration
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">IVR Enabled</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          society.ivr_enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {society.ivr_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IVR Name</label>
                      <p className="text-gray-900">{society.ivr_name || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IVR API Key</label>
                      <p className="text-gray-900 font-mono text-sm break-all">{society.ivr_api_key || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IVR Caller ID</label>
                      <p className="text-gray-900">{society.ivr_caller_id || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#C72030]" />
                    Timeline
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created At
                      </label>
                      <p className="text-gray-900 text-sm">
                        {formatDate(society.created_at)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <p className="text-gray-900 text-sm">
                        {formatDate(society.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="blocks" className="mt-6">
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Society Blocks</h2>
                <Button onClick={openAddBlock} className="bg-[#c72030] hover:bg-[#A01828] text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Block
                </Button>
              </div>
              {blocksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : blocks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No blocks found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Action</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">S.No.</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Name</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Description</th>
                        <th className="text-center px-6 py-3 font-semibold text-gray-700">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((block, idx) => (
                        <tr key={block.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                onClick={() => navigate(`/ops-console/master/location/account/societies/details/${id}/blocks/${block.id}`)}
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-black hover:bg-green-50 rounded"
                                onClick={() => openEditBlock(block)}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="p-1 text-black hover:bg-red-50 rounded" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete block "{block.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBlock(block.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{idx + 1}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{block.name}</td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{block.description || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              block.active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {block.active === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Block Add/Edit Modal */}
      <Dialog open={blockModalOpen} onOpenChange={open => { setBlockModalOpen(open); if (!open) setEditingBlockId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlockId ? "Edit Block" : "Add Block"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-3">
            <div className="space-y-1.5">
              <Label>Block Name <span className="text-red-500">*</span></Label>
              <Input
                value={blockFormData.name}
                onChange={e => setBlockFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter block name"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={blockFormData.description}
                onChange={e => setBlockFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">Active</span>
                <p className="text-xs text-gray-500">Set whether this block is active</p>
              </div>
              <Switch
                checked={blockFormData.active}
                onCheckedChange={checked => setBlockFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setBlockModalOpen(false); setEditingBlockId(null); }}>Cancel</Button>
              <Button
                onClick={editingBlockId ? handleUpdateBlock : handleCreateBlock}
                disabled={blockSubmitting}
                className={editingBlockId ? "bg-[#16A34A] hover:bg-[#15803D] text-white px-8" : "bg-[#C72030] hover:bg-[#A61C28] text-white px-8"}
              >
                {blockSubmitting ? "Saving..." : editingBlockId ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocietyDetailsPage;
