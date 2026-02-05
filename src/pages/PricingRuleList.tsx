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
      const token = localStorage.getItem("token") || "";
      const url = getFullUrl(`/pricing_rules.json?token=${token}`);
      const options = getAuthenticatedFetchOptions("GET");
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error("Failed to fetch pricing rules");
      }
      
      const data = await response.json();
      let allRules = data.pricing_rules || [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allRules = allRules.filter((rule: PricingRule) =>
          rule.name?.toLowerCase().includes(query) ||
          rule.rule_type?.toLowerCase().includes(query) ||
          rule.status?.toLowerCase().includes(query)
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
      const token = localStorage.getItem("token") || "";
      const url = getFullUrl(`/pricing_rules/${id}.json?token=${token}`);
      const options = getAuthenticatedFetchOptions("DELETE");
      const response = await fetch(url, options);
      
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
    { key: "id", label: "Sr No", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "rule_type", label: "Rule Type", sortable: true },
    { key: "discount", label: "Discount", sortable: false },
    { key: "quantity_range", label: "Quantity Range", sortable: false },
    { key: "status", label: "Status", sortable: true },
  ];

  const renderCell = (item: PricingRule, columnKey: string) => {
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
      case "name":
        return <span>{item.name || "-"}</span>;
      case "rule_type":
        return <span className="capitalize">{item.rule_type || "-"}</span>;
      case "discount":
        return (
          <span>
            {item.discount_percentage
              ? `${item.discount_percentage}%`
              : item.discount_amount
              ? `$${item.discount_amount}`
              : "-"}
          </span>
        );
      case "quantity_range":
        return (
          <span>
            {item.min_quantity || 0} - {item.max_quantity || "∞"}
          </span>
        );
      case "status":
        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              item.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {item.status}
          </span>
        );
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
