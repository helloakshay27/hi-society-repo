import React from "react";
import {
  Ambulance,
  ArrowLeft,
  Bike,
  Bus,
  Car,
  CarTaxiFront,
  Droplets,
  Flame,
  GraduationCap,
  Hospital,
  Hotel,
  House,
  Phone,
  Pizza,
  Shield,
  ShoppingBag,
  User,
  Wrench,
  X,
  Eye,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, TextField } from "@mui/material";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

const columns: ColumnConfig[] = [
  { key: "icon", label: "Icon", sortable: false, draggable: true },
  { key: "name", label: "Service Name", sortable: true, draggable: true },
  { key: "phone", label: "Contact Number", sortable: true, draggable: true },
];

type QuickCallIconKey =
  | "ambulance"
  | "taxi"
  | "police"
  | "fire"
  | "water"
  | "hospital"
  | "security"
  | "maintenance"
  | "food"
  | "shopping"
  | "hotel"
  | "school"
  | "home"
  | "user"
  | "phone"
  | "bus"
  | "car"
  | "bike";

type QuickCall = {
  id: string;
  name: string;
  phone: string;
  icon: QuickCallIconKey;
  icon_url?: string;
};

function createId() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const ICON_OPTIONS: Array<{
  key: QuickCallIconKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
}> = [
  {
    key: "ambulance",
    label: "Ambulance",
    Icon: Ambulance,
    bg: "bg-yellow-100",
  },
  { key: "taxi", label: "Taxi", Icon: CarTaxiFront, bg: "bg-blue-100" },
  { key: "hospital", label: "Hospital", Icon: Hospital, bg: "bg-emerald-100" },
  { key: "police", label: "Police", Icon: Shield, bg: "bg-sky-100" },
  { key: "fire", label: "Fire", Icon: Flame, bg: "bg-rose-100" },
  { key: "water", label: "Water", Icon: Droplets, bg: "bg-cyan-100" },
  { key: "security", label: "Security", Icon: User, bg: "bg-violet-100" },
  {
    key: "maintenance",
    label: "Maintenance",
    Icon: Wrench,
    bg: "bg-orange-100",
  },
  { key: "food", label: "Food", Icon: Pizza, bg: "bg-pink-100" },
  { key: "shopping", label: "Shopping", Icon: ShoppingBag, bg: "bg-lime-100" },
  { key: "hotel", label: "Hotel", Icon: Hotel, bg: "bg-amber-100" },
  { key: "school", label: "School", Icon: GraduationCap, bg: "bg-indigo-100" },
  { key: "home", label: "Home", Icon: House, bg: "bg-stone-100" },
  { key: "phone", label: "Call", Icon: Phone, bg: "bg-teal-100" },
  { key: "user", label: "Contact", Icon: User, bg: "bg-fuchsia-100" },
  { key: "bus", label: "Bus", Icon: Bus, bg: "bg-slate-100" },
  { key: "car", label: "Car", Icon: Car, bg: "bg-neutral-100" },
  { key: "bike", label: "Bike", Icon: Bike, bg: "bg-green-100" },
];

const CallDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const [quickCalls, setQuickCalls] = React.useState<QuickCall[]>([]);

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const fetchQuickCalls = React.useCallback(async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/public_directories.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.public_directories) {
        const mappedData = response.data.public_directories.map((d: any) => ({
          id: d.id.toString(),
          name: d.nature || "",
          phone: d.mobile || "",
          icon: "phone",
          icon_url: d.icon_url,
        }));
        setQuickCalls(mappedData);
      }
    } catch (error) {
      console.error("Error fetching quick calls", error);
      toast.error("Failed to load directories. Please try again.");
    }
  }, [baseUrl, token]);

  React.useEffect(() => {
    fetchQuickCalls();
  }, [fetchQuickCalls]);

  const [apiIcons, setApiIcons] = React.useState<any[]>([]);

  const fetchIcons = React.useCallback(async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/quick_call_icon_listing.json`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data && response.data.quick_call_icon) {
        setApiIcons(response.data.quick_call_icon);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load icons. Please try again.");
    }
  }, [baseUrl, token]);

  React.useEffect(() => {
    fetchIcons();
  }, [fetchIcons]);

  const [form, setForm] = React.useState<{
    name: string;
    phone: string;
    icon: QuickCallIconKey;
    quick_call_icon_id: number | null;
  }>({
    name: "",
    phone: "",
    icon: "ambulance",
    quick_call_icon_id: null,
  });

  const resetForm = React.useCallback(() => {
    setForm({
      name: "",
      phone: "",
      icon: "ambulance",
      quick_call_icon_id: null,
    });
  }, []);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<QuickCall | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [viewingDetails, setViewingDetails] = React.useState<any>(null);

  const handleViewClick = async (item: QuickCall) => {
    setViewingItem(item);
    setIsLoadingDetails(true);
    setViewingDetails(null);
    try {
      const response = await axios.get(
        `https://${baseUrl}/public_directories/${item.id}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setViewingDetails(response.data);
    } catch (error) {
      console.error("Error fetching directory details", error);
      toast.error("Failed to load directory details. Please try again.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeAdd = React.useCallback(() => {
    setIsAddOpen(false);
    resetForm();
    setEditingId(null);
  }, [resetForm]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = React.useCallback(async () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone || !form.quick_call_icon_id) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        public_directory: {
          nature: name,
          mobile: phone,
          active: 1,
        },
      };

      // Only include quick_call_icon_id if it's set
      if (form.quick_call_icon_id) {
        payload.public_directory.quick_call_icon_id = form.quick_call_icon_id;
      }

      if (editingId) {
        await axios.patch(
          `https://${baseUrl}/public_directories/${editingId}.json`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `https://${baseUrl}/public_directories.json`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Re-fetch list to get updated data from the server
      fetchQuickCalls();
      closeAdd();
      toast.success(editingId ? "Directory updated successfully!" : "Directory added successfully!");
    } catch (error: any) {
      console.error("Error saving directory entry", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save directory entry";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeAdd,
    form.icon,
    form.name,
    form.phone,
    editingId,
    baseUrl,
    token,
    fetchQuickCalls,
  ]);

  const formatPhone = (value: string) => value.replace(/[^\d+]/g, "");

  const fieldStyles = React.useMemo(
    () => ({
      height: { xs: 36, sm: 45 },
      "& .MuiInputBase-input, & .MuiSelect-select": {
        padding: { xs: "10px", sm: "12px" },
      },
    }),
    []
  );

  const renderCell = (item: QuickCall, columnKey: string) => {
    if (columnKey === "icon") {
      if (item.icon_url) {
        return (
          <div className="h-10 w-10 rounded-full grid place-items-center border border-black/5 bg-gray-50 overflow-hidden shrink-0">
            <img
              src={item.icon_url}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
        );
      }
      const icon =
        ICON_OPTIONS.find((o) => o.key === item.icon) ?? ICON_OPTIONS[0];
      const IconComponent = icon.Icon;
      return (
        <div
          className={cn(
            "h-10 w-10 rounded-full grid place-items-center border border-black/5 shrink-0",
            icon.bg
          )}
        >
          <IconComponent className="h-5 w-5 text-[#1A1A1A]" />
        </div>
      );
    }
    if (columnKey === "name") {
      return (
        <span className="text-sm font-semibold text-gray-900">{item.name}</span>
      );
    }
    if (columnKey === "phone") {
      return (
        <span className="text-xs text-gray-600 tracking-wide">
          {item.phone}
        </span>
      );
    }
    return (item as any)[columnKey];
  };

  const handleEditClick = (item: QuickCall) => {
    setEditingId(item.id);
    const apiIcon = apiIcons.find((icon) => icon.icon_url === item.icon_url);
    setForm({
      name: item.name,
      phone: item.phone,
      icon: item.icon,
      quick_call_icon_id: apiIcon ? apiIcon.id : null,
    });
    setIsAddOpen(true);
  };

  const renderActions = (item: QuickCall) => (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={() => handleEditClick(item)}>
        <Pencil className="w-4 h-4 text-gray-500 hover:text-[#BF213E]" />
      </Button>
    </div>
  );

  const leftActions = (
    <Button
      onClick={() => {
        resetForm();
        setEditingId(null);
        // Pre-select first icon if available
        if (apiIcons.length > 0) {
          setForm((p) => ({ ...p, quick_call_icon_id: apiIcons[0].id }));
        }
        setIsAddOpen(true);
      }}
      className="hidden sm:inline-flex"
    >
      + Add
    </Button>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Call Directory</h1>
      </div>

      {/* Content */}
      <div className="mx-auto">
        <EnhancedTable
          data={quickCalls}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="call-directory-table"
          className="min-w-full"
          emptyMessage="No quick calls found. Add one to get started."
          leftActions={leftActions}
          enableSearch={true}
          enableSelection={false}
          hideTableExport={true}
          pagination={true}
          pageSize={10}
        />
      </div>

      {/* Floating add button (mobile style like reference) */}
      <button
        type="button"
        onClick={() => {
          resetForm();
          setEditingId(null);
          // Pre-select first icon if available
          if (apiIcons.length > 0) {
            setForm((p) => ({ ...p, quick_call_icon_id: apiIcons[0].id }));
          }
          setIsAddOpen(true);
        }}
        className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#BF213E] text-white shadow-[0px_10px_30px_rgba(191,33,62,0.35)] grid place-items-center"
        aria-label="Add quick call"
      >
        <span className="text-2xl leading-none">+</span>
      </button>

      {/* Add Quick Call (matches Add Group modal style) */}
      <Dialog open={isAddOpen} onClose={closeAdd} maxWidth="sm" fullWidth>
        <DialogContent
          className="sm:max-w-[600px] max-h-[85vh] overflow-hidden"
          sx={{ padding: 0 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-medium text-gray-900">
                {editingId ? "Edit Quick Call" : "Add Quick Call"}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeAdd}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            <TextField
              label="Service Name"
              name="serviceName"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter Service Name"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
              sx={{ mt: 1 }}
            />
            <TextField
              label="Contact Number"
              name="contactNumber"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))
              }
              placeholder="Enter Contact Number"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles, inputMode: "tel" }}
              sx={{ mt: 1 }}
            />

            <div className="pt-1">
              <p className="text-sm font-medium text-gray-700">Select Icon</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {apiIcons.map((opt) => {
                  const isSelected = opt.id === form.quick_call_icon_id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, quick_call_icon_id: opt.id }))
                      }
                      className={cn(
                        "h-14 w-14 rounded-xl flex items-center justify-center border transition-all overflow-hidden shrink-0 bg-white",
                        isSelected
                          ? "border-[#BF213E] ring-2 ring-[#BF213E]/20 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      aria-label={opt.icon_name}
                      title={opt.icon_name}
                    >
                      <img
                        src={opt.icon_url}
                        alt={opt.icon_name}
                        className="h-8 w-8 object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
            <Button
              onClick={onSubmit}
              className="!bg-[#F2EEE9] !text-[#BF213E] hover:!bg-[#e8e1d9] px-10"
              disabled={!form.name.trim() || !form.phone.trim() || !form.quick_call_icon_id || isSubmitting}
              title={!form.quick_call_icon_id ? "Please select an icon" : ""}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            <Button
              onClick={closeAdd}
              className="!bg-[#F2EEE9] !text-[#BF213E] hover:!bg-[#e8e1d9] px-10"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Quick Call */}
      <Dialog
        open={!!viewingItem}
        onClose={() => setViewingItem(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent className="overflow-hidden" sx={{ padding: 0 }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-medium text-gray-900">
                View Quick Call
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingItem(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewingItem &&
            (() => {
              return (
                <div className="px-6 py-10 space-y-6 flex flex-col items-center justify-center">
                  {viewingItem.icon_url ? (
                    <div className="h-20 w-20 rounded-full grid place-items-center border border-black/5 bg-gray-50 overflow-hidden shrink-0">
                      <img
                        src={viewingItem.icon_url}
                        alt={viewingItem.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    (() => {
                      const icon =
                        ICON_OPTIONS.find((o) => o.key === viewingItem.icon) ??
                        ICON_OPTIONS[0];
                      const Icon = icon.Icon;
                      return (
                        <div
                          className={cn(
                            "h-20 w-20 rounded-full grid place-items-center border border-black/5 shrink-0",
                            icon.bg
                          )}
                        >
                          <Icon className="h-10 w-10 text-[#1A1A1A]" />
                        </div>
                      );
                    })()
                  )}
                  <div className="text-center max-w-sm w-full mx-auto space-y-2">
                    <p className="text-xl font-semibold text-gray-900">
                      {viewingItem.name}
                    </p>
                    <p className="text-base font-medium text-gray-600 tracking-wide">
                      {viewingItem.phone}
                    </p>

                    {isLoadingDetails ? (
                      <div className="mt-4 pt-4 border-t border-gray-100 w-full animate-pulse flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ) : viewingDetails ? (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center space-y-1.5 w-full">
                        {viewingDetails.email && (
                          <p className="text-sm text-gray-500">
                            Email:{" "}
                            <span className="text-gray-900 font-medium">
                              {viewingDetails.email}
                            </span>
                          </p>
                        )}
                        {viewingDetails.firstname || viewingDetails.lastname ? (
                          <p className="text-sm text-gray-500">
                            Name:{" "}
                            <span className="text-gray-900 font-medium">
                              {viewingDetails.firstname}{" "}
                              {viewingDetails.lastname}
                            </span>
                          </p>
                        ) : null}
                        <p className="text-sm text-gray-500">
                          Status:{" "}
                          <span className="text-gray-900 font-medium">
                            {viewingDetails.active === 1
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}

          <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <Button
              onClick={() => {
                const item = viewingItem;
                setViewingItem(null);
                if (item) handleEditClick(item);
              }}
              className="!bg-[#BF213E] !text-white hover:!bg-[#9e1b33] px-10"
            >
              Edit
            </Button>
            <Button
              onClick={() => setViewingItem(null)}
              className="!bg-[#F2EEE9] !text-[#BF213E] hover:!bg-[#e8e1d9] px-10"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallDirectory;
