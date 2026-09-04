import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/config/apiConfig";

interface BillCycleOption {
  id: number;
  name: string;
}

interface TowerOption {
  id: number;
  name: string;
}

interface FlatOption {
  id: number;
  flat_no: string;
}

const POSSESSION_OPTIONS = [
  { value: "true", label: "Possessed" },
  { value: "false", label: "Not Possessed" },
];

const pickList = (data: Record<string, unknown> | undefined, keys: string[]): unknown[] => {
  if (!data) return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[];
  }
  return [];
};

const toBillCycleOptions = (raw: unknown): BillCycleOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    return { id: Number(obj.id), name: String(obj.name ?? obj.label ?? obj.id ?? "") };
  });
};

const toTowerOptions = (raw: unknown): TowerOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    return { id: Number(obj.id), name: String(obj.name ?? "") };
  });
};

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
      <h2 className="text-lg font-medium text-gray-900 flex items-center">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: "#E5E0D3" }}
        >
          <Building2 size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const AccountingUnitsBillCycleMappingCreation: React.FC = () => {
  const navigate = useNavigate();
  const lockAccountId = localStorage.getItem("lock_account_id");
  const [billCycles, setBillCycles] = useState<BillCycleOption[]>([]);
  const [towers, setTowers] = useState<TowerOption[]>([]);
  const [flats, setFlats] = useState<FlatOption[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [billCycleId, setBillCycleId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [possession, setPossession] = useState("");
  const [flatIds, setFlatIds] = useState<number[]>([]);

  const fetchBillCycles = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const res = await axios.get(`${baseUrl}/account/society_bill_cycles.json`, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setBillCycles(toBillCycleOptions(res.data?.society_bill_cycles || []));
    } catch (error) {
      console.error("Error fetching bill cycles:", error);
      toast.error("Failed to load bill cycles");
    }
  }, [lockAccountId]);

  const fetchTowers = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const res = await axios.get(`${baseUrl}/account/soc_flat_charges/form_options.json`, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = (res.data || {}) as Record<string, unknown>;
      setTowers(toTowerOptions(pickList(data, ["towers"])));
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast.error("Failed to load towers");
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchBillCycles();
    fetchTowers();
  }, [fetchBillCycles, fetchTowers]);

  useEffect(() => {
    setFlatIds([]);
    setFlats([]);
    if (!towerId || !possession) return;

    const fetchFlats = async () => {
      setFlatsLoading(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/crm/admin/society_flats.json`, {
          params: {
            "q[society_block_id_eq]": towerId,
            "q[possession_eq]": possession,
            ...(lockAccountId ? { lock_account_id: lockAccountId } : {}),
          },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.society_flats)
            ? data.society_flats
            : [];
        setFlats(
          list.map((item: Record<string, unknown>) => ({
            id: Number(item.id),
            flat_no: String(item.flat_no ?? item.name ?? item.id ?? ""),
          }))
        );
      } catch (error) {
        console.error("Error fetching flats:", error);
        toast.error("Failed to load flats for the selected tower");
        setFlats([]);
      } finally {
        setFlatsLoading(false);
      }
    };
    fetchFlats();
  }, [towerId, possession, lockAccountId]);

  const handleSubmit = async () => {
    if (!billCycleId) {
      toast.error("Please select a Bill Cycle");
      return;
    }
    if (flatIds.length === 0) {
      toast.error("Please select at least one Flat");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const payload = {
        society_bill_cycle_id: Number(billCycleId),
        society_flat_id: flatIds,
      };
      await axios.post(`${baseUrl}/account/soc_flat_charges.json`, payload, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Bill cycle mapped to flats successfully");
      navigate("/accounting/units-bill-cycle-mapping");
    } catch (error) {
      console.error("Error mapping bill cycle to flats:", error);
      toast.error("Failed to map bill cycle to flats");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/units-bill-cycle-mapping")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Units &amp; Bill Cycle Mapping
      </button>

      <SectionCard title="Map Bill Cycle with Flats">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
            <InputLabel shrink>Select Bill Cycle</InputLabel>
            <Select
              value={billCycleId}
              onChange={(e) => setBillCycleId(e.target.value as string)}
              label="Select Bill Cycle"
              notched
              displayEmpty
            >
              <MenuItem value="">Select</MenuItem>
              {billCycles.map((cycle) => (
                <MenuItem key={cycle.id} value={String(cycle.id)}>
                  {cycle.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
            <InputLabel shrink>Select Tower</InputLabel>
            <Select
              value={towerId}
              onChange={(e) => setTowerId(e.target.value as string)}
              label="Select Tower"
              notched
              displayEmpty
            >
              <MenuItem value="">Select</MenuItem>
              {towers.map((tower) => (
                <MenuItem key={tower.id} value={String(tower.id)}>
                  {tower.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
            <InputLabel shrink>Possession Status</InputLabel>
            <Select
              value={possession}
              onChange={(e) => setPossession(e.target.value as string)}
              label="Possession Status"
              notched
              displayEmpty
            >
              <MenuItem value="">Select</MenuItem>
              {POSSESSION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Select Flats
            <span className="text-red-500"> *</span>
          </label>
          <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
            <Select
              multiple
              value={flatIds}
              onChange={(e) => setFlatIds(e.target.value as number[])}
              input={<OutlinedInput notched />}
              displayEmpty
              disabled={!towerId || !possession || flatsLoading}
              renderValue={(selected) => {
                const names = flats
                  .filter((flat) => (selected as number[]).includes(flat.id))
                  .map((flat) => flat.flat_no);
                return names.length > 0 ? (
                  names.join(", ")
                ) : (
                  <span style={{ color: "#888780" }}>
                    {!towerId || !possession ? "Select tower and possession status first" : "Select Flat"}
                  </span>
                );
              }}
            >
              {flatsLoading && <MenuItem disabled>Loading...</MenuItem>}
              {!flatsLoading && flats.length === 0 && <MenuItem disabled>No flats found</MenuItem>}
              {flats.map((flat) => (
                <MenuItem key={flat.id} value={flat.id}>
                  {flat.flat_no}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </SectionCard>

      <div className="mt-6 flex justify-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => navigate("/accounting/units-bill-cycle-mapping")}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AccountingUnitsBillCycleMappingCreation;
