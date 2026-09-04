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
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";

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

interface SocietyFlat {
  id: number;
  flat_no: string;
  society_id: number;
  block_no: string | null;
  is_enable: boolean | null;
  approve: boolean | null;
  approve_by: number | null;
  deleted_at: string | null;
  at_floor: number | null;
  build_up_area: number | null;
  super_area: number | null;
  society_flat_type_id: number | null;
  society_block_id: number | null;
  society_floor_id: number | null;
  rate: number | null;
  snag_sheet_file: string | null;
}

export const BlockDetailsPage: React.FC = () => {
  const { societyId, blockId } = useParams<{ societyId: string; blockId: string }>();
  const navigate = useNavigate();

  const [block, setBlock] = useState<SocietyBlock | null>(null);
  const [blockLoading, setBlockLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("details");

  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [flatModalOpen, setFlatModalOpen] = useState(false);
  const [editingFlatId, setEditingFlatId] = useState<number | null>(null);
  const [flatFormData, setFlatFormData] = useState({ flat_no: "", block_no: "", at_floor: "", build_up_area: "", super_area: "", rate: "" });
  const [flatSubmitting, setFlatSubmitting] = useState(false);

  const apiBase = HI_SOCIETY_CONFIG.BASE_URL;
  const apiToken = HI_SOCIETY_CONFIG.TOKEN;
  const authHeaders = { "Content-Type": "application/json" };

  const fetchBlock = async () => {
    if (!blockId) return;
    setBlockLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/society_blocks/${blockId}.json?token=${apiToken}`, { headers: authHeaders });
      const data = await res.json();
      setBlock(data.society_block || data);
    } catch (err) {
      console.error("fetchBlock failed:", err);
      toast.error("Failed to load block details.");
    } finally {
      setBlockLoading(false);
    }
  };

  const fetchFlats = async () => {
    if (!societyId || !blockId) return;
    setFlatsLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/society_flats.json?society_id=${societyId}&block_id=${blockId}&token=${apiToken}`, { headers: authHeaders });
      const data = await res.json();
      setFlats(Array.isArray(data.society_flats) ? data.society_flats : []);
    } catch (err) {
      console.error("fetchFlats failed:", err);
      toast.error("Failed to load flats.");
    } finally {
      setFlatsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlock();
    fetchFlats();
  }, [societyId, blockId]);

  const openAddFlat = () => {
    setEditingFlatId(null);
    setFlatFormData({ flat_no: "", block_no: block?.name || "", at_floor: "", build_up_area: "", super_area: "", rate: "" });
    setFlatModalOpen(true);
  };

  const handleCreateFlat = async () => {
    if (!flatFormData.flat_no.trim()) {
      toast.error("Flat number is required.");
      return;
    }
    if (!societyId) return;
    setFlatSubmitting(true);
    try {
      const url = `${apiBase}/admin/society_flats.json?token=${apiToken}`;
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          society_flat: {
            flat_no: flatFormData.flat_no.trim(),
            block_no: flatFormData.block_no.trim() || null,
            at_floor: flatFormData.at_floor ? Number(flatFormData.at_floor) : null,
            build_up_area: flatFormData.build_up_area ? Number(flatFormData.build_up_area) : null,
            super_area: flatFormData.super_area ? Number(flatFormData.super_area) : null,
            rate: flatFormData.rate ? Number(flatFormData.rate) : null,
            society_id: parseInt(societyId),
            society_block_id: blockId ? parseInt(blockId) : null,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to create flat");
      toast.success("Flat created successfully.");
      setFlatModalOpen(false);
      fetchFlats();
    } catch (err) {
      console.error("handleCreateFlat failed:", err);
      toast.error("Failed to create flat.");
    } finally {
      setFlatSubmitting(false);
    }
  };

  const openEditFlat = async (flat: SocietyFlat) => {
    setEditingFlatId(flat.id);
    setFlatSubmitting(true);
    try {
      const url = `${apiBase}/admin/society_flats/${flat.id}.json?token=${apiToken}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      const f = data.society_flat || data;
      setFlatFormData({
        flat_no: f.flat_no ?? "",
        block_no: f.block_no ?? "",
        at_floor: f.at_floor != null ? String(f.at_floor) : "",
        build_up_area: f.build_up_area != null ? String(f.build_up_area) : "",
        super_area: f.super_area != null ? String(f.super_area) : "",
        rate: f.rate != null ? String(f.rate) : "",
      });
      setFlatModalOpen(true);
    } catch (err) {
      console.error("openEditFlat failed:", err);
      toast.error("Failed to load flat details.");
    } finally {
      setFlatSubmitting(false);
    }
  };

  const handleUpdateFlat = async () => {
    if (!flatFormData.flat_no.trim()) {
      toast.error("Flat number is required.");
      return;
    }
    if (editingFlatId === null) return;
    setFlatSubmitting(true);
    try {
      const url = `${apiBase}/admin/society_flats/${editingFlatId}.json?token=${apiToken}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          society_flat: {
            flat_no: flatFormData.flat_no.trim(),
            block_no: flatFormData.block_no.trim() || null,
            at_floor: flatFormData.at_floor ? Number(flatFormData.at_floor) : null,
            build_up_area: flatFormData.build_up_area ? Number(flatFormData.build_up_area) : null,
            super_area: flatFormData.super_area ? Number(flatFormData.super_area) : null,
            rate: flatFormData.rate ? Number(flatFormData.rate) : null,
            society_block_id: blockId ? parseInt(blockId) : null,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to update flat");
      toast.success("Flat updated successfully.");
      setFlatModalOpen(false);
      setEditingFlatId(null);
      fetchFlats();
    } catch (err) {
      console.error("handleUpdateFlat failed:", err);
      toast.error("Failed to update flat.");
    } finally {
      setFlatSubmitting(false);
    }
  };

  const handleDeleteFlat = async (flatId: number) => {
    try {
      const url = `${apiBase}/admin/society_flats/${flatId}.json?token=${apiToken}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete flat");
      toast.success("Flat deleted successfully.");
      fetchFlats();
    } catch (err) {
      console.error("handleDeleteFlat failed:", err);
      toast.error("Failed to delete flat.");
    }
  };

  if (blockLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#C72030]" />
          <p className="text-gray-600">Loading block details...</p>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Block Not Found</h2>
          <p className="text-gray-600 mb-6">The requested block could not be found.</p>
          <Button
            onClick={() => navigate(`/ops-console/master/location/account/societies/details/${societyId}`)}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Society
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/ops-console/master/location/account/societies/details/${societyId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Society
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{block.name}</h1>
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  block.active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {block.active === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="details" className="data-[state=active]:bg-[#C72030] data-[state=active]:text-white px-6 py-2">
              Block Details
            </TabsTrigger>
            <TabsTrigger value="flats" className="data-[state=active]:bg-[#C72030] data-[state=active]:text-white px-6 py-2">
              Flats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#C72030]" />
                Block Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block ID</label>
                    <p className="text-gray-900 font-mono">#{block.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">{block.name}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{block.description || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    block.active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {block.active === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="flats" className="mt-6">
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Flats in {block.name}</h2>
                <Button onClick={openAddFlat} className="bg-[#c72030] hover:bg-[#A01828] text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Flat
                </Button>
              </div>
              {flatsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : flats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No flats found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Action</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">S.No.</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Flat No</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Block No</th>
                        <th className="text-center px-6 py-3 font-semibold text-gray-700">Floor</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-700">Build Up Area</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-700">Super Area</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-700">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flats.map((flat, idx) => (
                        <tr key={flat.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1 text-black hover:bg-green-50 rounded"
                                onClick={() => openEditFlat(flat)}
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
                                      Are you sure you want to delete flat "{flat.flat_no}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteFlat(flat.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{idx + 1}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{flat.flat_no || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{flat.block_no || '-'}</td>
                          <td className="px-6 py-4 text-center">{flat.at_floor ?? '-'}</td>
                          <td className="px-6 py-4 text-right">{flat.build_up_area ?? '-'}</td>
                          <td className="px-6 py-4 text-right">{flat.super_area ?? '-'}</td>
                          <td className="px-6 py-4 text-right">{flat.rate ?? '-'}</td>
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

      <Dialog open={flatModalOpen} onOpenChange={open => { setFlatModalOpen(open); if (!open) setEditingFlatId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFlatId ? "Edit Flat" : "Add Flat"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Flat No <span className="text-red-500">*</span></Label>
                <Input
                  value={flatFormData.flat_no}
                  onChange={e => setFlatFormData(prev => ({ ...prev, flat_no: e.target.value }))}
                  placeholder="e.g. A-101"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Block No</Label>
                <Input
                  value={flatFormData.block_no}
                  onChange={e => setFlatFormData(prev => ({ ...prev, block_no: e.target.value }))}
                  placeholder="Block name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Floor</Label>
                <Input
                  type="number"
                  min="0"
                  value={flatFormData.at_floor}
                  onChange={e => setFlatFormData(prev => ({ ...prev, at_floor: e.target.value }))}
                  placeholder="Floor number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rate</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={flatFormData.rate}
                  onChange={e => setFlatFormData(prev => ({ ...prev, rate: e.target.value }))}
                  placeholder="Rate"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Build Up Area</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={flatFormData.build_up_area}
                  onChange={e => setFlatFormData(prev => ({ ...prev, build_up_area: e.target.value }))}
                  placeholder="Area sq.ft"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Super Area</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={flatFormData.super_area}
                  onChange={e => setFlatFormData(prev => ({ ...prev, super_area: e.target.value }))}
                  placeholder="Area sq.ft"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setFlatModalOpen(false); setEditingFlatId(null); }}>Cancel</Button>
              <Button
                onClick={editingFlatId ? handleUpdateFlat : handleCreateFlat}
                disabled={flatSubmitting}
                className={editingFlatId ? "bg-[#16A34A] hover:bg-[#15803D] text-white px-8" : "bg-[#C72030] hover:bg-[#A61C28] text-white px-8"}
              >
                {flatSubmitting ? "Saving..." : editingFlatId ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlockDetailsPage;
