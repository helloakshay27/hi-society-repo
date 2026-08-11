import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Calculator, Send } from "lucide-react";

interface BillCycleOption {
  id: number;
  name: string;
}

interface LedgerOption {
  id: number;
  name: string;
  formatted_name?: string;
}

interface ChargeSetup {
  id: number;
  name: string;
  value: number | null;
  basis: string;
  charge_category: string;
}

interface CalculationRow {
  key: string;
  unitId: number;
  unitName: string;
  chargeName: string;
  basis: string;
  amount: number;
}

const columns: ColumnConfig[] = [
  { key: "unitName", label: "Unit / Ledger", sortable: true },
  { key: "chargeName", label: "Charge", sortable: true },
  { key: "basis", label: "Basis", sortable: true },
  { key: "amount", label: "Amount ₹", sortable: true },
];

const AccountingChargeCalculations: React.FC = () => {
  const [billCycles, setBillCycles] = useState<BillCycleOption[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [ledgers, setLedgers] = useState<LedgerOption[]>([]);
  const [charges, setCharges] = useState<ChargeSetup[]>([]);
  const [rows, setRows] = useState<CalculationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchLookups = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [cycleRes, ledgerRes, chargeRes] = await Promise.all([
        axios.get(`${baseUrl}/account/society_bill_cycles.json`, { headers }),
        axios.get(`${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers.json`, {
          headers,
        }),
        axios.get(`${baseUrl}/account/charge_setups.json`, { headers }),
      ]);

      setBillCycles(cycleRes.data?.society_bill_cycles || []);
      setLedgers(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);
      setCharges(Array.isArray(chargeRes.data?.charge_setups) ? chargeRes.data.charge_setups : []);
    } catch (error) {
      console.error("Error fetching charge calculation lookups:", error);
      toast.error("Failed to load bill cycles / units / charges");
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  const handleCalculate = () => {
    if (!selectedCycleId) {
      toast.error("Please select a Bill Cycle first.");
      return;
    }
    setCalculating(true);
    try {
      const fixedCharges = charges.filter(
        (charge) => (charge.basis || "").toLowerCase() !== "expense based" && charge.value
      );

      const computed: CalculationRow[] = [];
      ledgers.forEach((ledger) => {
        fixedCharges.forEach((charge) => {
          computed.push({
            key: `${ledger.id}-${charge.id}`,
            unitId: ledger.id,
            unitName: ledger.formatted_name || ledger.name,
            chargeName: charge.name,
            basis: charge.basis || "-",
            amount: Number(charge.value) || 0,
          });
        });
      });

      setRows(computed);
      if (computed.length === 0) {
        toast.info("No fixed-value charges found to calculate. Expense-based charges need manual amounts.");
      } else {
        toast.success("Charges calculated for the selected bill cycle");
      }
    } finally {
      setCalculating(false);
    }
  };

  const grandTotal = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  const handleGenerateBills = async () => {
    if (!selectedCycleId) {
      toast.error("Please select a Bill Cycle first.");
      return;
    }
    if (rows.length === 0) {
      toast.error("Calculate charges before generating bills.");
      return;
    }
    setGenerating(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/lock_accounts/${lockAccountId}/generate_bills.json`,
        { bill_cycle_id: selectedCycleId },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success("Bills generated successfully for the selected cycle");
    } catch (error) {
      console.error("Error generating bills:", error);
      toast.error("Failed to generate bills");
    } finally {
      setGenerating(false);
    }
  };

  const renderCell = (item: CalculationRow, columnKey: string) => {
    switch (columnKey) {
      case "unitName":
        return item.unitName;
      case "chargeName":
        return item.chargeName;
      case "basis":
        return item.basis;
      case "amount":
        return item.amount.toFixed(2);
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <label className="mb-1 block text-sm font-medium text-gray-700">Bill Cycle</label>
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select Bill Cycle" />
            </SelectTrigger>
            <SelectContent>
              {billCycles.map((cycle) => (
                <SelectItem key={cycle.id} value={String(cycle.id)}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
         variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium" 
          onClick={handleCalculate}
          disabled={calculating || loading}
        >
          <Calculator className="mr-2 h-4 w-4" /> Calculate Charges
        </Button>
        <Button
          variant="outline"
          onClick={handleGenerateBills}
          disabled={generating || rows.length === 0}
        >
          <Send className="mr-2 h-4 w-4" /> Generate Bills
        </Button>
        {rows.length > 0 && (
          <div className="ml-auto text-base font-semibold text-gray-900">
            Grand Total: ₹{grandTotal.toFixed(2)}
          </div>
        )}
      </div>

      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => item.key}
        pagination
        pageSize={20}
        storageKey="charge-calculations-table"
        loading={loading}
        loadingMessage="Loading..."
        emptyMessage="Select a bill cycle and click Calculate Charges to preview amounts"
      />
    </div>
  );
};

export default AccountingChargeCalculations;
