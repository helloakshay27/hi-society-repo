import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { EnhancedTaskTable } from "@/components/enhanced-table/EnhancedTaskTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { TicketPagination } from "@/components/TicketPagination";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useDebounce } from "@/hooks/useDebounce";
import { getUser } from "@/utils/auth";
import { AddZoneModal } from "@/components/AddZoneModal";
import { EditZoneModal } from "@/components/EditZoneModal";

interface ZoneItem {
  id: number;
  name: string;
  active: boolean;
  headquarter_id: number | null;
  region_id: number | null;
  created_at: string;
  headquarter?: { id: number; name: string };
  pms_region?: { name: string };
}

interface ZoneTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  entriesPerPage: string;
  setEntriesPerPage: (entries: string) => void;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Action", sortable: false, hideable: false, draggable: false },
  { key: "name", label: "Zone Name", sortable: true, hideable: true, draggable: true },
  { key: "headquarter", label: "Headquarter", sortable: true, hideable: true, draggable: true },
  { key: "region", label: "Region", sortable: true, hideable: true, draggable: true },
  { key: "status", label: "Status", sortable: true, hideable: true, draggable: true },
  { key: "created_at", label: "Created At", sortable: true, hideable: true, draggable: true },
];

export const ZoneTab: React.FC<ZoneTabProps> = ({
  searchQuery,
  setSearchQuery,
  entriesPerPage,
  setEntriesPerPage,
}) => {
  const { getFullUrl, getAuthHeader } = useApiConfig();

  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 1000);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const userEmail = getUser()?.email || "";

  useEffect(() => {
    const allowedEmails = [
      "abhishek.sharma@lockated.com",
      "adhip.shetty@lockated.com",
      "helloakshay27@gmail.com",
      "dev@lockated.com",
      "sumitra.patil@lockated.com",
      "komalshinde0101@lockated.com",
      "demo@lockated.com",
      "akshay.shinde@lockated.com",
    ];
    setCanEdit(allowedEmails.includes(userEmail));
  }, [userEmail]);

  const fetchZones = useCallback(async (page = 1, per_page = 10, search = "") => {
    setLoading(true);
    try {
      let url = getFullUrl(`/pms/zones.json?show_all=true&page=${page}&per_page=${per_page}`);
      if (search.trim()) {
        url += `&q[name_cont]=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result && Array.isArray(result.zones)) {
        setZones(result.zones);
        if (result.pagination) {
          setPagination(result.pagination);
        } else {
          setPagination({
            current_page: page,
            per_page,
            total_pages: Math.ceil(result.zones.length / per_page),
            total_count: result.zones.length,
            has_next_page: false,
            has_prev_page: false,
          });
        }
      } else {
        setZones([]);
      }
    } catch (error: unknown) {
      toast.error(`Failed to load zones: ${error instanceof Error ? error.message : "Unknown error"}`);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [getFullUrl, getAuthHeader]);

  useEffect(() => {
    fetchZones(currentPage, perPage, debouncedSearch);
  }, [currentPage, perPage, debouncedSearch, fetchZones]);

  const handleToggleStatus = async (zoneId: number, currentStatus: boolean) => {
    if (!canEdit) { toast.error("You do not have permission to update zone status"); return; }
    try {
      const response = await fetch(getFullUrl(`/pms/zones/${zoneId}.json`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({ pms_zone: { active: !currentStatus } }),
      });

      if (response.ok) {
        toast.success(`Zone ${!currentStatus ? "activated" : "deactivated"} successfully`);
        fetchZones(currentPage, perPage, debouncedSearch);
      } else {
        toast.error("Failed to update zone status");
      }
    } catch {
      toast.error("Error updating zone status");
    }
  };

  const handleEdit = (id: number) => {
    setSelectedZoneId(id);
    setIsEditModalOpen(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    if (!term.trim()) fetchZones(1, perPage, "");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return "Invalid date"; }
  };

  const renderRow = (zone: ZoneItem) => ({
    actions: (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleEdit(zone.id)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Edit"
          disabled={!canEdit}
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    ),
    name: <div className="font-medium">{zone.name || "N/A"}</div>,
    headquarter: (
      <span className="text-sm text-gray-600">{zone.headquarter?.name || "—"}</span>
    ),
    region: (
      <span className="text-sm text-gray-600">{zone.pms_region?.name || "—"}</span>
    ),
    status: (
      <div className="flex items-center gap-2">
        <Switch
          checked={zone.active}
          onCheckedChange={() => handleToggleStatus(zone.id, zone.active)}
          disabled={!canEdit}
          aria-label={`Toggle status for ${zone.name}`}
        />
      </div>
    ),
    created_at: (
      <span className="text-sm text-gray-600">{formatDate(zone.created_at)}</span>
    ),
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zones</h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
          <span className="ml-2 text-gray-600">Loading zones...</span>
        </div>
      ) : (
        <>
          <EnhancedTaskTable
            data={zones}
            columns={columns}
            renderRow={renderRow}
            storageKey="zone-dashboard-v1"
            hideTableExport={true}
            hideTableSearch={false}
            enableSearch={true}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            pagination={true}
            leftActions={
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsAddModalOpen(true)}
                disabled={!canEdit}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Zone
              </Button>
            }
          />

          {/* <TicketPagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            totalRecords={pagination.total_count}
            perPage={perPage}
            isLoading={loading}
            onPageChange={(page) => setCurrentPage(page)}
            onPerPageChange={(newPerPage) => { setPerPage(newPerPage); setCurrentPage(1); }}
          /> */}
        </>
      )}

      <AddZoneModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchZones(currentPage, perPage, debouncedSearch);
          setIsAddModalOpen(false);
        }}
        canEdit={canEdit}
      />

      {selectedZoneId !== null && (
        <EditZoneModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedZoneId(null); }}
          onSuccess={() => {
            fetchZones(currentPage, perPage, debouncedSearch);
            setIsEditModalOpen(false);
            setSelectedZoneId(null);
          }}
          zoneId={selectedZoneId}
          canEdit={canEdit}
        />
      )}
    </div>
  );
};
