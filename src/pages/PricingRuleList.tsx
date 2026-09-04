import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { getFullUrl, getAuthenticatedFetchOptions } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

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
  const { shouldShow } = useDynamicPermissions();
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')
  const navigate = useNavigate();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchPricingRules = useCallback(async () => {
    setLoading(true);
    try {
      const url = `https://${baseUrl}/pricing_rules.json?token=${token}`;
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
      setTotalCount(allRules.length);
      setTotalPages(Math.ceil(allRules.length / itemsPerPage) || 1);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedRules = allRules.slice(startIndex, startIndex + itemsPerPage);
      setPricingRules(paginatedRules);
    } catch (error) {
      toast.error("Failed to load pricing rules", {
        description: String(error),
      });
      setPricingRules([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    fetchPricingRules();
  }, [fetchPricingRules]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
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
      const url = `https://${baseUrl}/pricing_rules/${id}?token=${token}`;
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
    { key: "platform_fee_type", label: "Platform Fee Type", sortable: true },
    { key: "platform_fee_value", label: "Platform Fee Value", sortable: true },
    { key: "created_at", label: "Created At", sortable: true },
  ];

  const renderCell = (item: any, columnKey: string) => {
    const index = pricingRules.findIndex(r => r.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            {shouldShow("PricingRule", "update") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(item.id);
                }}
              >
                <Edit className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Trash2 className="w-4 h-4" style={{ color: '#000000' }} />
            </button>
          </div>
        );
      case "id":
        return <span className="text-sm font-medium">{startIndex + index + 1}</span>;
      case "organization_id":
        return <span className="text-sm">{item.organization_id || "-"}</span>;
      case "generic_category_id":
        return <span className="text-sm">{item.generic_category_id || "-"}</span>;
      case "margin_type":
        return <span className="text-sm capitalize">{item.margin_type || "-"}</span>;
      case "margin_value":
        return <span className="text-sm">{item.margin_value ? `${item.margin_value}${item.margin_type === 'percentage' ? '%' : ''}` : "-"}</span>;
      case "platform_fee_type":
        return <span className="text-sm capitalize">{item.platform_fee_type || "-"}</span>;
      case "platform_fee_value":
        return <span className="text-sm">{item.platform_fee_value ? `${item.platform_fee_value}${item.platform_fee_type === 'percentage' ? '%' : ''}` : "-"}</span>;
      case "created_at":
        return <span className="text-sm">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</span>;
      default:
        return null;
    }
  };

  const renderCustomActions = () => (
    <>
      {shouldShow("PricingRule", "create") && (
        <Button
          onClick={handleAdd}
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"         >
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Rule
        </Button>
      )}
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
        {totalCount > 0 && (
          <div className="flex items-center justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingRuleList;
