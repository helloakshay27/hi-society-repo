import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

interface PaymentTerm {
  id: number;
  name: string;
  no_of_days: number;
}

const PaymentTermsPage: React.FC = () => {
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", no_of_days: "" });
  const [submitting, setSubmitting] = useState(false);

  const getBaseUrl = () => localStorage.getItem("baseUrl") || "";
  const getToken = () => localStorage.getItem("token") || "";

  const fetchPaymentTerms = async () => {
    setLoading(true);
    try {
      const url = `https://${getBaseUrl()}/accounting/payment_terms.json?token=${getToken()}`;
      const res = await axios.get(url);
      setPaymentTerms(Array.isArray(res.data) ? res.data : res.data.payment_terms || []);
    } catch (err) {
      console.error("Error fetching payment terms:", err);
      toast.error("Failed to load payment terms!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: "", no_of_days: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (term: PaymentTerm) => {
    setIsEditMode(true);
    setEditingId(term.id);
    setFormData({ name: term.name, no_of_days: term.no_of_days.toString() });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a name!");
      return;
    }
    if (!formData.no_of_days || isNaN(Number(formData.no_of_days)) || Number(formData.no_of_days) < 0) {
      toast.error("Please enter a valid number of days!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        payment_term: {
          name: formData.name.trim(),
          no_of_days: Number(formData.no_of_days),
        },
      };

      if (isEditMode && editingId) {
        await axios.patch(
          `https://${getBaseUrl()}/accounting/payment_terms/${editingId}.json?token=${getToken()}`,
          payload
        );
        toast.success("Payment term updated successfully!");
      } else {
        await axios.post(
          `https://${getBaseUrl()}/accounting/payment_terms.json?token=${getToken()}`,
          payload
        );
        toast.success("Payment term created successfully!");
      }

      setIsDialogOpen(false);
      fetchPaymentTerms();
    } catch (err) {
      console.error("Error saving payment term:", err);
      toast.error("Failed to save payment term!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `https://${getBaseUrl()}/accounting/payment_terms/${id}.json?token=${getToken()}`
      );
      toast.success("Payment term deleted successfully!");
      fetchPaymentTerms();
    } catch (err) {
      console.error("Error deleting payment term:", err);
      toast.error("Failed to delete payment term!");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Terms</h1>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#C72030] hover:bg-[#A61B29] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Term
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 w-16">Sr. No.</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">No. of Days</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paymentTerms.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No payment terms found.
                </td>
              </tr>
            ) : (
              paymentTerms.map((term, index) => (
                <tr key={term.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{term.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{term.no_of_days}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(term)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-[#C72030]"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Payment Term" : "Add Payment Term"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter payment term name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                No. of Days <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder="Enter number of days"
                value={formData.no_of_days}
                onChange={(e) => setFormData((prev) => ({ ...prev, no_of_days: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#C72030] hover:bg-[#A61B29] text-white"
              disabled={submitting}
            >
              {submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentTermsPage;
