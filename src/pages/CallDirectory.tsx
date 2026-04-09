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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, TextField } from "@mui/material";

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
  { key: "ambulance", label: "Ambulance", Icon: Ambulance, bg: "bg-yellow-100" },
  { key: "taxi", label: "Taxi", Icon: CarTaxiFront, bg: "bg-blue-100" },
  { key: "hospital", label: "Hospital", Icon: Hospital, bg: "bg-emerald-100" },
  { key: "police", label: "Police", Icon: Shield, bg: "bg-sky-100" },
  { key: "fire", label: "Fire", Icon: Flame, bg: "bg-rose-100" },
  { key: "water", label: "Water", Icon: Droplets, bg: "bg-cyan-100" },
  { key: "security", label: "Security", Icon: User, bg: "bg-violet-100" },
  { key: "maintenance", label: "Maintenance", Icon: Wrench, bg: "bg-orange-100" },
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

  const [quickCalls, setQuickCalls] = React.useState<QuickCall[]>([
    { id: "1", name: "Ambulance", phone: "102", icon: "ambulance" },
    { id: "2", name: "Police", phone: "100", icon: "police" },
    { id: "3", name: "Fire", phone: "101", icon: "fire" },
  ]);

  const [form, setForm] = React.useState<{
    name: string;
    phone: string;
    icon: QuickCallIconKey;
  }>({
    name: "",
    phone: "",
    icon: "ambulance",
  });

  const selectedIcon = React.useMemo(
    () => ICON_OPTIONS.find((o) => o.key === form.icon) ?? ICON_OPTIONS[0],
    [form.icon]
  );

  const resetForm = React.useCallback(() => {
    setForm({ name: "", phone: "", icon: "ambulance" });
  }, []);

  const closeAdd = React.useCallback(() => {
    setIsAddOpen(false);
    resetForm();
  }, [resetForm]);

  const onSubmit = React.useCallback(() => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone) return;

    setQuickCalls((prev) => [
      {
        id: createId(),
        name,
        phone,
        icon: form.icon,
      },
      ...prev,
    ]);
    closeAdd();
  }, [closeAdd, form.icon, form.name, form.phone]);

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

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10 font-sans">
      {/* Header */}
      <div className="relative mb-8">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 top-0 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="text-center w-full max-w-5xl mx-auto pt-2">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Call Directory
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto text-center">
            Add quick-call services with icons for faster access.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-black/10 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 tracking-wide">
                QUICK CALLS
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tap any tile to copy the number (coming next).
              </p>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="hidden sm:inline-flex"
            >
              Add Quick Call
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {quickCalls.map((c) => {
              const icon =
                ICON_OPTIONS.find((o) => o.key === c.icon) ?? ICON_OPTIONS[0];
              const Icon = icon.Icon;
              return (
                <div
                  key={c.id}
                  className="border border-black/10 bg-[#FFFEFC] p-3 hover:border-black/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full grid place-items-center border border-black/5",
                        icon.bg
                      )}
                    >
                      <Icon className="h-5 w-5 text-[#1A1A1A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-600 tracking-wide">
                        {c.phone}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating add button (mobile style like reference) */}
      <button
        type="button"
        onClick={() => setIsAddOpen(true)}
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
                Add Quick Call
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
              <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 gap-3">
                {ICON_OPTIONS.slice(0, 32).map((opt) => {
                  const Icon = opt.Icon;
                  const isSelected = opt.key === form.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, icon: opt.key }))}
                      className={cn(
                        "h-12 w-12 rounded-full grid place-items-center border transition-colors",
                        opt.bg,
                        isSelected
                          ? "border-[#BF213E] ring-2 ring-[#BF213E]/20"
                          : "border-black/10 hover:border-black/20"
                      )}
                      aria-label={opt.label}
                      title={opt.label}
                    >
                      <Icon className="h-5 w-5 text-[#1A1A1A]" />
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
              disabled={!form.name.trim() || !form.phone.trim()}
            >
              Submit
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
    </div>
  );
};

export default CallDirectory;
