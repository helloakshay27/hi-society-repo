import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  AddLockAccountGroupModal,
  EditableLockAccountGroup,
} from "@/components/AddLockAccountGroupModal";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 20;

interface LockAccountGroupAPI {
  id: number;
  lock_account_id?: number;
  account_name?: string | null;
  group_name: string;
  parent_group_id?: number | null;
  base_group_id?: number | null;
  locked?: boolean | null;
}

interface SubgroupRow {
  id: number;
  accountName: string;
  groupName: string;
  parentGroup: string;
  baseGroup: string;
  raw: LockAccountGroupAPI;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "id", label: "Id", sortable: true },
  { key: "accountName", label: "Account Name", sortable: true },
  { key: "groupName", label: "Group Name", sortable: true },
  { key: "parentGroup", label: "Parent Group", sortable: true },
  { key: "baseGroup", label: "Base Group", sortable: true },
];

// The 4 fundamental account types (base_group_id) are fixed system roots that
// never appear as their own entries in GET /lock_account_groups.
const ROOT_GROUP_NAMES: Record<number, string> = {
  1: "Assets",
  2: "Liabilities",
  3: "Income",
  4: "Expenditure",
};

const AccountingSubgroupSetup: React.FC = () => {
  const [rows, setRows] = useState<SubgroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EditableLockAccountGroup | null>(null);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const authHeaders = () => {
    const token = API_CONFIG.TOKEN;
    return {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // GET /lock_accounts/:id/lock_account_groups.json (server-paginated:
  // { pagination: { current_page, total_pages, total_count, per_page }, lock_account_groups: [...] })
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const res = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups.json`,
        { params: { page: currentPage, per_page: PAGE_SIZE }, headers: authHeaders() }
      );
      const data = res.data;
      const groups: LockAccountGroupAPI[] = Array.isArray(data)
        ? data
        : data?.lock_account_groups ?? data?.groups ?? data?.data ?? [];
      // Parent/base group names can only be resolved against groups present on
      // this page — a parent living on another page falls back to "-".
      const nameById = new Map(groups.map((g) => [g.id, g.group_name]));
      const resolveName = (id?: number | null) => {
        if (!id) return "-";
        return nameById.get(id) || ROOT_GROUP_NAMES[id] || "-";
      };
      setRows(
        groups.map((g) => ({
          id: g.id,
          accountName: g.account_name || "",
          groupName: g.group_name,
          parentGroup: resolveName(g.parent_group_id),
          baseGroup: resolveName(g.base_group_id),
          raw: g,
        }))
      );
      const pagination = data?.pagination;
      setTotalPages(pagination?.total_pages ? Number(pagination.total_pages) : 1);
    } catch (error) {
      console.error("Error fetching account groups:", error);
      toast.error("Failed to fetch account groups");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId, currentPage]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAdd = () => {
    setEditingGroup(null);
    setIsAddOpen(true);
  };

  const handleEdit = (item: SubgroupRow) => {
    setEditingGroup({
      id: item.raw.id,
      group_name: item.raw.group_name,
      parent_group_id: item.raw.parent_group_id,
      locked: item.raw.locked,
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (item: SubgroupRow) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      await axios.delete(`${baseUrl}/lock_account_groups/${item.id}`, {
        headers: authHeaders(),
      });
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  // GET /lock_accounts/:id/lock_account_groups.xlsx
  const handleExport = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups.xlsx`,
        {
          responseType: "blob",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "subgroups.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting subgroups:", error);
      toast.error("Failed to export subgroups");
    }
  };

  const renderCell = (item: SubgroupRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="p-1" onClick={() => handleEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="p-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{item.groupName}</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case "id":
        return item.id;
      case "accountName":
        return item.accountName || "-";
      case "groupName":
        return item.groupName;
      case "parentGroup":
        return item.parentGroup;
      case "baseGroup":
        return item.baseGroup;
      default:
        return "";
    }
  };

  // Sliding 3-page window anchored at the current page (current, current+1,
  // current+2, clamped to stay inside range) with page 1 / last page always
  // reachable — e.g. page 3 → "3 4 5 ... 21", page 4 → "1 ... 4 5 6 ... 21".
  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) {
      return null;
    }

    const pageItem = (page: number) => (
      <PaginationItem key={page} className="cursor-pointer">
        <PaginationLink
          onClick={() => setCurrentPage(page)}
          isActive={currentPage === page}
          aria-disabled={loading}
          className={loading ? "pointer-events-none opacity-50" : ""}
        >
          {page}
        </PaginationLink>
      </PaginationItem>
    );

    const windowSize = 3;
    const items = [];

    if (totalPages <= windowSize + 2) {
      for (let i = 1; i <= totalPages; i++) items.push(pageItem(i));
      return items;
    }

    let start = currentPage;
    const end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);

    if (start > 1) {
      items.push(pageItem(1));
      if (start > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = start; i <= end; i++) items.push(pageItem(i));

    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(pageItem(totalPages));
    }

    return items;
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
       <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          SubGroups
        </h1>
      </div>
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination={false}
        enableGlobalSearch
        searchPlaceholder="Search"
        enableExport
        onExport={handleExport}
        exportFileName="subgroup-setup"
        storageKey="subgroup-setup-table"
        loading={loading}
        loadingMessage="Loading account groups..."
        emptyMessage="No matching records found"
        leftActions={
          <Button
            onClick={handleAdd}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        }
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 || loading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={
                    currentPage === totalPages || loading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AddLockAccountGroupModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaved={fetchGroups}
        editingGroup={editingGroup}
      />
    </div>
  );
};

export default AccountingSubgroupSetup;
