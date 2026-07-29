import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface AccountingInvoiceFilters {
  tower?: string;
  billNumber?: string;
  unit?: string;
  paymentStatus?: string;
  publishStatus?: string;
}

interface AccountingInvoiceFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AccountingInvoiceFilters) => void;
  onResetFilters: () => void;
  currentFilters?: AccountingInvoiceFilters;
  towerOptions: string[];
  unitOptions: string[];
}

export const AccountingInvoiceFilterDialog: React.FC<AccountingInvoiceFilterDialogProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onResetFilters,
  currentFilters = {},
  towerOptions,
  unitOptions,
}) => {
  const [filters, setFilters] = useState<AccountingInvoiceFilters>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key: keyof AccountingInvoiceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? undefined : value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onResetFilters();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-visible">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">Filter Bills</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Select Tower</Label>
            <Select
              value={filters.tower || "all"}
              onValueChange={(value) => handleFilterChange("tower", value)}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300">
                <SelectValue placeholder="Select Tower" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                <SelectItem value="all">All Towers</SelectItem>
                {towerOptions.map((tower) => (
                  <SelectItem key={tower} value={tower}>
                    {tower}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="billNumber">Bill Number Search</Label>
            <Input
              id="billNumber"
              placeholder="Bill Number Search"
              value={filters.billNumber || ""}
              onChange={(e) => handleFilterChange("billNumber", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Select Unit</Label>
            <Select
              value={filters.unit || "all"}
              onValueChange={(value) => handleFilterChange("unit", value)}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                <SelectItem value="all">All Units</SelectItem>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Select Payment Status</Label>
            <Select
              value={filters.paymentStatus || "all"}
              onValueChange={(value) => handleFilterChange("paymentStatus", value)}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300">
                <SelectValue placeholder="Select Payment Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Select Publish Status</Label>
            <Select
              value={filters.publishStatus || "all"}
              onValueChange={(value) => handleFilterChange("publishStatus", value)}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300">
                <SelectValue placeholder="Select Publish Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply} className="bg-[#C72030] hover:bg-[#A01B28] text-white">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountingInvoiceFilterDialog;
