import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";

interface LedgerOption {
  id: number;
  name: string;
  formatted_name?: string;
  account_code?: string;
  bill_cycle_id?: number | null;
}

interface BillCycleOption {
  id: number;
  name: string;
}

interface UnitRow {
  id: number;
  unitName: string;
  accountCode: string;
  billCycleId: string;
}

const columns: ColumnConfig[] = [
  { key: "unitName", label: "Unit / Ledger", sortable: true },
  { key: "accountCode", label: "Account Code", sortable: true },
  { key: "billCycle", label: "Bill Cycle", sortable: false },
];

const AccountingUnitsBillCycleMapping: React.FC = () => {
  const [ledgers, setLedgers] = useState<LedgerOption[]>([]);
  const [billCycles, setBillCycles] = useState<BillCycleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [ledgerRes, cycleRes] = await Promise.all([
        axios.get(`${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers.json`, {
          headers,
        }),
        axios.get(`${baseUrl}/account/society_bill_cycles.json`, { headers }),
      ]);

      setLedgers(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);
      setBillCycles(cycleRes.data?.society_bill_cycles || []);
    } catch (error) {
      console.error("Error fetching units/bill cycles:", error);
      toast.error("Failed to fetch units and bill cycles");
      setLedgers([]);
      setBillCycles([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows: UnitRow[] = useMemo(
    () =>
      ledgers.map((ledger) => ({
        id: ledger.id,
        unitName: ledger.formatted_name || ledger.name,
        accountCode: ledger.account_code || "",
        billCycleId: ledger.bill_cycle_id ? String(ledger.bill_cycle_id) : "",
      })),
    [ledgers]
  );

  const handleAssign = async (unitId: number, billCycleId: string) => {
    setSavingId(unitId);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.patch(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers/${unitId}.json`,
        { lock_account_ledger: { bill_cycle_id: billCycleId || null } },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success("Bill cycle mapping updated");
      setLedgers((prev) =>
        prev.map((ledger) =>
          ledger.id === unitId
            ? { ...ledger, bill_cycle_id: billCycleId ? Number(billCycleId) : null }
            : ledger
        )
      );
    } catch (error) {
      console.error("Error updating bill cycle mapping:", error);
      toast.error("Failed to update mapping");
    } finally {
      setSavingId(null);
    }
  };

  const renderCell = (item: UnitRow, columnKey: string) => {
    switch (columnKey) {
      case "unitName":
        return item.unitName;
      case "accountCode":
        return item.accountCode;
      case "billCycle":
        return (
          <Select
            value={item.billCycleId || "none"}
            onValueChange={(value) => handleAssign(item.id, value === "none" ? "" : value)}
            disabled={savingId === item.id}
          >
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Select Bill Cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {billCycles.map((cycle) => (
                <SelectItem key={cycle.id} value={String(cycle.id)}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        storageKey="units-bill-cycle-mapping-table"
        loading={loading}
        loadingMessage="Loading units..."
        emptyMessage="No units found"
      />
    </div>
  );
};

export default AccountingUnitsBillCycleMapping;
