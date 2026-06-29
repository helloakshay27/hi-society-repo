import React, { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, ImageIcon, X } from "lucide-react";
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

interface BrandPartner {
  id: number;
  brand_name: string;
  position: number;
  active: string | boolean;
  logo_url: string | null;
}

interface FormState {
  brand_name: string;
  position: string;
  active: boolean;
  logo: File | null;
}

const emptyForm: FormState = {
  brand_name: "",
  position: "",
  active: true,
  logo: null,
};

const BrandPartnersConfigList: React.FC = () => {
  const { shouldShow } = useDynamicPermissions();
  const token = API_CONFIG.TOKEN || "";

  const [data, setData] = useState<BrandPartner[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = getFullUrl(`/admin/brand_partner_configs?token=${token}`);
      const res = await fetch(url, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      const json = await res.json();
      setData(Array.isArray(json.brand_partners) ? json.brand_partners : []);
    } catch {
      toast.error("Failed to load Brand Partners list");
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
    setLogoPreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: BrandPartner) => {
    setEditingId(item.id);
    setForm({
      brand_name: item.brand_name || "",
      position: String(item.position ?? ""),
      active: item.active === true || item.active === "true",
      logo: null,
    });
    setLogoPreview(item.logo_url || null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, logo: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSave = async () => {
    if (!form.brand_name.trim()) {
      toast.error("Brand Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("brand_partner_config[brand_name]", form.brand_name);
      payload.append("brand_partner_config[position]", form.position);
      payload.append("brand_partner_config[active]", form.active ? "true" : "false");
      if (form.logo) {
        payload.append("brand_partner_config[logo]", form.logo);
      }

      const isEdit = editingId !== null;
      const url = getFullUrl(
        isEdit
          ? `/admin/brand_partner_configs/${editingId}?token=${token}`
          : `/admin/brand_partner_configs?token=${token}`
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
      const url = getFullUrl(`/admin/brand_partner_configs/${deletingId}?token=${token}`);
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

  const handleToggleActive = async (item: BrandPartner) => {
    const newActive = !(item.active === true || item.active === "true");
    try {
      const payload = new FormData();
      payload.append("brand_partner_config[active]", newActive ? "true" : "false");
      const url = getFullUrl(`/admin/brand_partner_configs/${item.id}?token=${token}`);
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
    { key: "brand_name", label: "Brand Name", sortable: true },
    { key: "position", label: "Position", sortable: true },
    { key: "logo", label: "Logo", sortable: false },
    { key: "active", label: "Status", sortable: false },
  ];

  const renderCell = (item: BrandPartner, columnKey: string, index?: number) => {
    switch (columnKey) {
      case "srNo":
        return (index !== undefined ? index : data.findIndex((d) => d.id === item.id)) + 1;

      case "actions":
        return (
          <div className="flex items-center gap-1">
            {shouldShow("BrandPartnerConfig", "update") && (
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
            {/* {shouldShow("BrandPartnerConfig", "destroy") && (
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

      case "brand_name":
        return <span className="font-medium">{item.brand_name || "-"}</span>;

      case "position":
        return <span>{item.position ?? "-"}</span>;

      case "logo":
        return item.logo_url ? (
          <img
            src={item.logo_url}
            alt={item.brand_name}
            className="h-10 w-10 rounded object-cover border border-[#e5e1d8]"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-[#f6f4ee] border border-[#e5e1d8] flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-gray-400" />
          </div>
        );

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
      {shouldShow("BrandPartnerConfig", "create") && (
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Brand Partners</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage brand partner configurations and their display settings
        </p>
      </div>

      <div className="overflow-x-auto animate-fade-in">
        <EnhancedTable
          data={data}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="brand-partners-config"
          storageKey="brand-partners-config-table"
          enableSelection={false}
          leftActions={renderCustomActions()}
          rightActions={null}
          searchPlaceholder="Search"
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
              {editingId ? "Edit Brand Partner" : "Add Brand Partner"}
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
            {/* Brand Name */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">
                Brand Name <span className="text-red-500">*</span>
              </Label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => setForm((p) => ({ ...p, brand_name: e.target.value }))}
                placeholder="Enter brand name"
                className="w-full border border-[#D9D9D9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030] focus:border-[#C72030]"
              />
            </div>

            {/* Position */}
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

            {/* Logo Upload */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">Logo</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D9D9D9] rounded-md p-4 cursor-pointer hover:border-[#C72030] transition-colors flex items-center gap-4"
              >
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-14 w-14 object-cover rounded border border-[#e5e1d8]"
                    />
                    <span className="text-sm text-gray-500">Click to change logo</span>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-sm">Click to upload logo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                title="Upload logo"
                className="hidden"
                onChange={handleLogoChange}
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
              Are you sure you want to delete this brand partner? This action cannot be undone.
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

export default BrandPartnersConfigList;
