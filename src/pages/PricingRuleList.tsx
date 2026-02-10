import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Pencil } from "lucide-react";
import { getFullUrl, getAuthenticatedFetchOptions } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";

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

  const fetchPricingRules = useCallback(async () => {
    setLoading(true);
    try {
      const url = "http://localhost:3000/pricing_rules";
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

  const handleEdit = (id: number) => {
    navigate(`/settings/pricing-rule-edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this pricing rule?")) {
      return;
    }

    try {
      const url = `http://localhost:3000/pricing_rules/${id}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete pricing rule");
      }
      
      toast.success("Pricing rule deleted successfully");
      fetchPricingRules();
    } catch (error) {
      toast.error("Failed to delete pricing rule", {
        description: String(error),
      });
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: false },
    { key: "organization_id", label: "Organization ID", sortable: true },
    { key: "generic_category_id", label: "Category ID", sortable: true },
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
              className="text-[#C72030] hover:text-[#A01828]"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      case "id":
        return <span className="font-medium">{index + 1}</span>;
      case "organization_id":
        return <span>{item.organization_id || "-"}</span>;
      case "generic_category_id":
        return <span>{item.generic_category_id || "-"}</span>;
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
    </div>
  );
};

export default PricingRuleList;
