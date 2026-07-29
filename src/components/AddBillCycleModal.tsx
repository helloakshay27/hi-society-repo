import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";
import { X } from "lucide-react";

const FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly"];

interface AddBillCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const AddBillCycleModal: React.FC<AddBillCycleModalProps> = ({
  open,
  onOpenChange,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentDueDays, setPaymentDueDays] = useState("");
  const [frequency, setFrequency] = useState("");
  const [fineType, setFineType] = useState<"flat" | "percentage">("flat");
  const [fineRate, setFineRate] = useState("0");
  const [interestType, setInterestType] = useState<"flat" | "percentage">("flat");
  const [interestRate, setInterestRate] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setStartDate("");
    setEndDate("");
    setPaymentDueDays("");
    setFrequency("");
    setFineType("flat");
    setFineRate("0");
    setInterestType("flat");
    setInterestRate("0");
  };

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Bill Cycle Name is required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start Date and End Date are required");
      return;
    }
    if (!frequency) {
      toast.error("Bill Cycle Frequency is required");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const payload = {
        society_bill_cycle: {
          name,
          start_month: startDate,
          end_month: endDate,
          due_date: startDate,
          payment_due_in: Number(paymentDueDays) || 0,
          frequency,
          fine_type: fineType,
          fine_rate: Number(fineRate) || 0,
          interest_type: interestType,
          interest_rate: Number(interestRate) || 0,
          active: 1,
        },
      };
      await axios.post(`${baseUrl}/account/society_bill_cycles.json`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Bill cycle created successfully");
      resetForm();
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating bill cycle:", error);
      toast.error("Failed to create bill cycle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between bg-cyan-500 px-6 py-3">
          <h2 className="text-lg font-medium text-white">New Bill Cycle</h2>
          <button type="button" onClick={handleClose} className="text-white hover:opacity-80" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Bill Cycle Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Payment Due in (Days)</label>
            <Input
              type="number"
              min={0}
              value={paymentDueDays}
              onChange={(e) => setPaymentDueDays(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Bill Cycle Frequency</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Fine</label>
              <Select value={fineType} onValueChange={(v) => setFineType(v as "flat" | "percentage")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                {fineType === "percentage" ? "Fine Percentage (%)" : "Fine Amount"}
              </label>
              <Input type="number" min={0} value={fineRate} onChange={(e) => setFineRate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Interest</label>
              <Select
                value={interestType}
                onValueChange={(v) => setInterestType(v as "flat" | "percentage")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                {interestType === "percentage" ? "Interest Percentage (%)" : "Interest Amount"}
              </label>
              <Input
                type="number"
                min={0}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center border-t border-gray-200 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-w-[140px] bg-green-600 text-white hover:bg-green-700"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillCycleModal;
