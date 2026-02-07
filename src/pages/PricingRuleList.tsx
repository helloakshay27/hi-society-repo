import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Edit } from "lucide-react";
import { getFullUrl, getAuthenticatedFetchOptions } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button as MuiButton } from "@mui/material";

interface PricingRule {
  id: number;
  name: string;
  rule_type: string;
  discount_percentage?: number;
  discount_amount?: number;
  min_quantity?: number;
  max_quantity?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  created_at: string;
}

const PricingRuleList: React.FC = () => {
  const navigate = useNavigate();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  // Fetch organizations and categories on mount
  useEffect(() => {
    setLoadingOrgs(true);
    fetch("https://runwal-api.lockated.com/organizations.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ")
      .then((res) => res.json())
      .then((data) => setOrganizations(data.organizations || []))
      .catch(() => setOrganizations([]))
      .finally(() => setLoadingOrgs(false));

    setLoadingCats(true);
    fetch("https://runwal-api.lockated.com/generic_categories?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  const fetchPricingRules = useCallback(async () => {
    setLoading(true);
    try {
      const url = "https://runwal-api.lockated.com/pricing_rules";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch pricing rules");
      }
      const data = await response.json();
      let allRules = data || [];
      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allRules = allRules.filter((rule: any) =>
          rule.organization_id?.toString().includes(query) ||
          rule.generic_category_id?.toString().includes(query) ||
          rule.margin_type?.toLowerCase().includes(query)
        );
      }
      setPricingRules(allRules);
    } catch (error) {
      toast.error("Failed to load pricing rules", {
        description: String(error),
      });
      setPricingRules([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPricingRules();
  }, [fetchPricingRules]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleAdd = () => {
    navigate("/settings/pricing-rule-create");
  };

  // Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editOrgId, setEditOrgId] = useState<string | number>("");
  const [editCatId, setEditCatId] = useState<string | number>("");
  const [editMarginType, setEditMarginType] = useState<string>("percentage");
  const [editMarginValue, setEditMarginValue] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);

  const handleEdit = (id: number) => {
    const rule = pricingRules.find(r => r.id === id);
    setEditId(id);
    setEditOrgId(rule?.organization_id ?? "");
    setEditCatId(rule?.generic_category_id ?? "");
    setEditMarginType(rule?.margin_type ?? "percentage");
    setEditMarginValue(rule?.margin_value ? String(rule.margin_value) : "");
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditId(null);
    setEditOrgId("");
    setEditCatId("");
    setEditMarginType("percentage");
    setEditMarginValue("");
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    if (
      editOrgId === '' || editOrgId === null || editOrgId === undefined ||
      editCatId === '' || editCatId === null || editCatId === undefined ||
      !editMarginValue.trim()
    ) {
      toast.error("Please fill all fields");
      return;
    }
    setEditLoading(true);
    try {
      const url = `https://runwal-api.lockated.com/pricing_rules/${editId}`;
      const payload = {
        pricing_rule: {
          organization_id: typeof editOrgId === 'string' ? parseInt(editOrgId) : editOrgId,
          generic_category_id: typeof editCatId === 'string' ? parseInt(editCatId) : editCatId,
          margin_type: editMarginType,
          margin_value: parseFloat(editMarginValue),
        },
      };
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to update pricing rule");
      }
      toast.success("Pricing rule updated successfully!");
      handleEditClose();
      fetchPricingRules();
    } catch (error) {
      toast.error("Failed to update pricing rule", {
        description: String(error),
      });
    } finally {
      setEditLoading(false);
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: false },
    { key: "organization_id", label: "Organization", sortable: true },
    { key: "generic_category_id", label: "Category", sortable: true },
    { key: "margin_type", label: "Margin Type", sortable: true },
    { key: "margin_value", label: "Margin Value", sortable: true },
    { key: "created_at", label: "Created At", sortable: true },
  ];

  const renderCell = (item: any, columnKey: string) => {
    const index = pricingRules.findIndex(r => r.id === item.id);
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(item.id)}
              className="text-gray-600 hover:text-[#C72030]"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        );
      case "id":
        return <span className="font-medium">{index + 1}</span>;
      case "organization_id": {
        if (!item.organization_id) return <span>-</span>;
        const org = organizations.find((o) => o.id === item.organization_id);
        return <span>{org ? org.name : item.organization_id}</span>;
      }
      case "generic_category_id": {
        if (!item.generic_category_id) return <span>-</span>;
        const cat = categories.find((c) => c.id === item.generic_category_id);
        return <span>{cat ? cat.name : item.generic_category_id}</span>;
      }
      case "margin_type":
        return <span className="capitalize">{item.margin_type || "-"}</span>;
      case "margin_value":
        return <span>{item.margin_value ? `${item.margin_value}${item.margin_type === 'percentage' ? '%' : ''}` : "-"}</span>;
      case "created_at":
        return <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</span>;
      default:
        return null;
    }
  };

  const renderCustomActions = () => (
    <>
      <Button
        onClick={handleAdd}
        className="bg-[#C72030] hover:bg-[#A01828] text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Pricing Rule
      </Button>
    </>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="space-y-6">
        <EnhancedTable
          data={pricingRules}
          columns={columns}
          renderCell={renderCell}
          enableExport={false}
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          leftActions={renderCustomActions()}
          loading={loading}
          loadingMessage="Loading pricing rules..."
        />
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold text-[#1A1A1A]">
                  Edit Pricing Rule
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Update pricing rule details below
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-4 pb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1A1A]">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Select value={editOrgId?.toString()} onValueChange={setEditOrgId}>
                <SelectTrigger className="bg-gray-50 border-[#e5e1d8]">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.length === 0 ? (
                    <div className="px-3 py-2 text-gray-400">No organizations found</div>
                  ) : (
                    organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1A1A]">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={editCatId?.toString()} onValueChange={setEditCatId}>
                <SelectTrigger className="bg-gray-50 border-[#e5e1d8]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-gray-400">No categories found</div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1A1A]">
                Margin Type <span className="text-red-500">*</span>
              </Label>
              <Select value={editMarginType} onValueChange={setEditMarginType}>
                <SelectTrigger className="bg-gray-50 border-[#e5e1d8]">
                  <SelectValue placeholder="Select margin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1A1A]">
                Margin Value <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={editMarginValue}
                onChange={e => setEditMarginValue(e.target.value)}
                className="bg-gray-50 border-[#e5e1d8]"
                placeholder="e.g., 10"
                min={0}
                step={0.01}
              />
            </div>
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleEditSubmit}
                className="bg-[#C72030] hover:bg-[#A01828] text-white px-12"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleEditClose}
                className="bg-[#e7e3d9] text-[#C72030] px-6 ml-4"
                disabled={editLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingRuleList;
