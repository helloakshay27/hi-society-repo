import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getFullUrl } from "@/config/apiConfig";

const API_URL = "https://runwal-api.lockated.com/pricing_rules.json?type=customer&token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";

const columns = [
    { key: "actions", label: "Actions", sortable: true },
  { key: "id", label: "Sr No", sortable: true },
  { key: "organization_id", label: "Organization", sortable: true },
  { key: "generic_category_id", label: "Category", sortable: true },
  { key: "margin_type", label: "Margin Type", sortable: true },
  { key: "margin_value", label: "Margin Value", sortable: true },
  { key: "created_at", label: "Created At", sortable: true },
];

export const CustomerPricingRuleList = () => {
    const handleAdd = () => {
      setEditId(null);
      setEditOrgId("");
      setEditCatId("");
      setEditMarginType("percentage");
      setEditMarginValue("");
      setEditOpen(true);
    };
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editOrgId, setEditOrgId] = useState("");
  const [editCatId, setEditCatId] = useState("");
  const [editMarginType, setEditMarginType] = useState("percentage");
  const [editMarginValue, setEditMarginValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
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
    fetchPricingRules();
  }, []);

  const fetchPricingRules = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch rules");
      const data = await response.json();
      setPricingRules(Array.isArray(data) ? data : data.pricing_rules || []);
    } catch (error) {
      toast.error("Failed to load pricing rules");
      setPricingRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
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
      let url, method;
      let payload = {
        pricing_rule: {
          organization_id: typeof editOrgId === 'string' ? parseInt(editOrgId) : editOrgId,
          generic_category_id: typeof editCatId === 'string' ? parseInt(editCatId) : editCatId,
          margin_type: editMarginType,
          margin_value: parseFloat(editMarginValue),
          type: 'customer',
        },
      };
      if (editId) {
        url = `https://runwal-api.lockated.com/pricing_rules/${editId}`;
        method = "PATCH";
      } else {
        url = "https://runwal-api.lockated.com/pricing_rules.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
        method = "POST";
      }
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(editId ? "Failed to update pricing rule" : "Failed to add pricing rule");
      }
      toast.success(editId ? "Pricing rule updated successfully!" : "Pricing rule added successfully!");
      handleEditClose();
      fetchPricingRules();
    } catch (error) {
      toast.error(editId ? "Failed to update pricing rule" : "Failed to add pricing rule", {
        description: String(error),
      });
    } finally {
      setEditLoading(false);
    }
  };
  const renderCustomActions = () => (
    <Button
      onClick={handleAdd}
      className="bg-[#C72030] hover:bg-[#A01828] text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Pricing Rule
    </Button>
  );

  const renderCell = (item, columnKey) => {
    const index = pricingRules.findIndex(r => r.id === item.id);
    switch (columnKey) {
      case "id":
        return <span className="text-sm font-medium">{index + 1}</span>;
      case "organization_id": {
        if (!item.organization_id) return <span className="text-sm">-</span>;
        const org = organizations.find((o) => o.id === item.organization_id);
        return <span className="text-sm">{org ? org.name : item.organization_id}</span>;
      }
      case "generic_category_id": {
        if (!item.generic_category_id) return <span className="text-sm">-</span>;
        const cat = categories.find((c) => c.id === item.generic_category_id);
        return <span className="text-sm">{cat ? cat.name : item.generic_category_id}</span>;
      }
      case "margin_type":
        return <span className="text-sm capitalize">{item.margin_type || "-"}</span>;
      case "margin_value":
        return <span className="text-sm">{item.margin_value ? `${item.margin_value}${item.margin_type === 'percentage' ? '%' : ''}` : "-"}</span>;
      case "created_at":
        return <span className="text-sm">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</span>;
      case "actions":
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item.id);
              }}
              className="text-gray-600 hover:text-[#C72030]"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Customer Pricing Rules</h1>
        <Button className="bg-[#C72030] text-white" onClick={() => setEditOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Rule
        </Button>
      </div>
      <EnhancedTable
        data={pricingRules}
        columns={columns}
        renderCell={renderCell}
        loading={loading}
        loadingMessage="Loading pricing rules..."
        emptyMessage="No pricing rules found"
        enableExport={true}
        exportFileName="customer-pricing-rules"
        storageKey="customer-pricing-rules-table"
        leftActions={renderCustomActions()}
      />
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold text-[#1A1A1A]">
                  {editId ? "Edit Pricing Rule" : "Add Pricing Rule"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  {editId ? "Update pricing rule details below" : "Add new pricing rule details below"}
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

export default CustomerPricingRuleList;
