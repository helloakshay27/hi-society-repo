import React, { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, TrendingUp, X, ImageIcon } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@mui/material";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface WaysToEarnImage {
  id: number;
  url: string;
}

interface WaysToEarn {
  id: number;
  title: string;
  description: string;
  points: string;
  position: number;
  active: string | boolean;
  image: WaysToEarnImage | string | null;
}

const getImageUrl = (image: WaysToEarnImage | string | null): string | null => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (image.url) {
    const decoded = decodeURIComponent(image.url);
    return decoded.startsWith("//") ? `https:${decoded}` : decoded;
  }
  return null;
};

interface FormState {
  title: string;
  description: string;
  points: string;
  position: string;
  active: boolean;
  image: File | null;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  points: "",
  position: "",
  active: true,
  image: null,
};

const WaysToEarnList: React.FC = () => {
  const { shouldShow } = useDynamicPermissions();
  const token = API_CONFIG.TOKEN || "";

  const [data, setData] = useState<WaysToEarn[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = getFullUrl(`/admin/ways_to_earn_configs?token=${token}`);
      const res = await fetch(url, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      const json = await res.json();
      setData(Array.isArray(json.ways_to_earn) ? json.ways_to_earn : []);
    } catch {
      toast.error("Failed to load Ways to Earn list");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: WaysToEarn) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      description: item.description || "",
      points: item.points || "",
      position: String(item.position ?? ""),
      active: item.active === true || item.active === "true",
      image: null,
    });
    setImagePreview(getImageUrl(item.image));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("ways_to_earn_config[title]", form.title);
      payload.append("ways_to_earn_config[description]", form.description);
      payload.append("ways_to_earn_config[points]", form.points);
      payload.append("ways_to_earn_config[position]", form.position);
      payload.append("ways_to_earn_config[active]", form.active ? "true" : "false");
      if (form.image) {
        payload.append("ways_to_earn_config[image]", form.image);
      }

      const isEdit = editingId !== null;
      const url = getFullUrl(
        isEdit
          ? `/admin/ways_to_earn_configs/${editingId}?token=${token}`
          : `/admin/ways_to_earn_configs?token=${token}`
      );
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { Authorization: getAuthHeader() },
        body: payload,
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      toast.success(isEdit ? "Updated successfully" : "Created successfully");
      closeDialog();
      fetchList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeleting(true);
    try {
      const url = getFullUrl(`/admin/ways_to_earn_configs/${deletingId}?token=${token}`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchList();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (item: WaysToEarn) => {
    const newActive = !(item.active === true || item.active === "true");
    try {
      const payload = new FormData();
      payload.append("ways_to_earn_config[active]", newActive ? "true" : "false");
      const url = getFullUrl(`/admin/ways_to_earn_configs/${item.id}?token=${token}`);
      const res = await fetch(url, {
        method: "PATCH",
        headers: { Authorization: getAuthHeader() },
        body: payload,
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated");
      fetchList();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: "srNo", label: "Sr. No.", sortable: false },
    { key: "actions", label: "Actions", sortable: false },
    { key: "title", label: "Title", sortable: true },
    { key: "description", label: "Description", sortable: false },
    { key: "points", label: "Points", sortable: true },
    { key: "position", label: "Position", sortable: true },
    { key: "image", label: "Image", sortable: false },
    { key: "active", label: "Status", sortable: false },
  ];

  const renderCell = (item: WaysToEarn, columnKey: string, index?: number) => {
    switch (columnKey) {
      case "srNo":
        return (index !== undefined ? index : data.findIndex((d) => d.id === item.id)) + 1;

      case "actions":
        return (
          <div className="flex items-center gap-1">
            {shouldShow("WaysToEarn", "update") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
                onClick={() => openEditDialog(item)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {/* {shouldShow("WaysToEarn", "destroy") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-gray-100"
                onClick={() => openDeleteDialog(item.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )} */}
          </div>
        );

      case "title":
        return <span className="font-medium">{item.title || "-"}</span>;

      case "description":
        return (
          <span className="text-gray-600 line-clamp-2 max-w-xs">
            {item.description || "-"}
          </span>
        );

      case "points":
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[#C72030]">
            <TrendingUp className="h-3.5 w-3.5" />
            {item.points || "-"}
          </span>
        );

      case "position":
        return <span>{item.position ?? "-"}</span>;

      case "image": {
        const imgUrl = getImageUrl(item.image);
        return imgUrl ? (
          <img
            src={imgUrl}
            alt={item.title}
            className="h-10 w-10 rounded object-cover border border-[#e5e1d8]"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-[#f6f4ee] border border-[#e5e1d8] flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-gray-400" />
          </div>
        );
      }

      case "active":
        return (
          <Switch
            checked={item.active === true || item.active === "true"}
            onChange={() => handleToggleActive(item)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#04a231" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7fce95" },
              "& .MuiSwitch-track": { backgroundColor: "#d2d2d2" },
              "& .MuiSwitch-switchBase": { color: "#c72030" },
            }}
          />
        );

      default:
        return "-";
    }
  };

  const renderCustomActions = () => (
    <div className="flex gap-2">
      {shouldShow("WaysToEarn", "create") && (
        <Button
          onClick={openAddDialog}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Ways to Earn</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the ways users can earn loyalty points
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto animate-fade-in">
        <EnhancedTable
          data={data}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="ways-to-earn"
          storageKey="ways-to-earn-table"
          enableSelection={false}
          leftActions={renderCustomActions()}
          rightActions={null}
          searchPlaceholder="Search Ways to Earn"
          hideTableExport={false}
          hideColumnsButton={false}
          className="transition-all duration-500 ease-in-out"
          loading={loading}
          loadingMessage="Loading..."
          getItemId={(item) => String(item.id)}
        />
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#F6F4EE] border-b border-[#D9D9D9] px-6 py-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-semibold text-[#1A1A1A] uppercase tracking-wide">
              {editingId ? "Edit Ways to Earn" : "Add Ways to Earn"}
            </DialogTitle>
            <button
              type="button"
              onClick={closeDialog}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4 bg-white">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">
                Title <span className="text-red-500">*</span>
              </Label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Enter title"
                className="w-full border border-[#D9D9D9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030] focus:border-[#C72030]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Enter description"
                rows={3}
                className="w-full border border-[#D9D9D9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030] focus:border-[#C72030] resize-none"
              />
            </div>

            {/* Points + Position */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Points</Label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
                  placeholder="e.g. 1000"
                  className="w-full border border-[#D9D9D9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030] focus:border-[#C72030]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Position</Label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                  placeholder="e.g. 1"
                  className="w-full border border-[#D9D9D9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030] focus:border-[#C72030]"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">Image</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D9D9D9] rounded-md p-4 cursor-pointer hover:border-[#C72030] transition-colors flex items-center gap-4"
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-14 w-14 object-cover rounded border border-[#e5e1d8]"
                    />
                    <span className="text-sm text-gray-500">Click to change image</span>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-sm">Click to upload image</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                title="Upload image"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-[#1A1A1A]">Active</Label>
              <Switch
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#04a231" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7fce95" },
                  "& .MuiSwitch-track": { backgroundColor: "#d2d2d2" },
                  "& .MuiSwitch-switchBase": { color: "#c72030" },
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-[#F6F4EE] border-t border-[#D9D9D9]">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-[#D9D9D9] text-[#1A1A1A] hover:bg-[#e5e1d8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setDeleteDialogOpen(false); setDeletingId(null); } }}>
        <DialogContent className="max-w-sm w-full p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#F6F4EE] border-b border-[#D9D9D9] px-6 py-4">
            <DialogTitle className="text-base font-semibold text-[#1A1A1A]">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 bg-white">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-[#F6F4EE] border-t border-[#D9D9D9]">
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setDeletingId(null); }}
              className="border-[#D9D9D9] text-[#1A1A1A] hover:bg-[#e5e1d8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaysToEarnList;
