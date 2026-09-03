import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ticketManagementAPI } from "@/services/ticketManagementAPI";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

interface SmartsecureGateRow {
  id: number;
  gateName: string;
  gateDevice: string;
  societyName: string;
  societyBlockName: string;
  userName: string;
  active: boolean;
}

interface EnquiryRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  societyName: string;
  message: string;
  gateDevice: string;
}

// A gate created via the QuikGate flow always has a building attached;
// Smartsecure gates use a society block instead, so we filter on that.
const isSmartsecureGate = (gate: any) =>
  !gate.building_id && !gate.building?.id;

const gateColumns: ColumnConfig[] = [
  { key: "societyName", label: "Society", sortable: true, hideable: true, draggable: true },
  { key: "societyBlockName", label: "Society Block", sortable: true, hideable: true, draggable: true },
  { key: "userName", label: "User", sortable: true, hideable: true, draggable: true },
  { key: "gateName", label: "Gate Name", sortable: true, hideable: true, draggable: true },
  { key: "gateDevice", label: "Gate Device", sortable: true, hideable: true, draggable: true },
  { key: "status", label: "Status", sortable: false, hideable: true, draggable: true },
];

const enquiryColumns: ColumnConfig[] = [
  { key: "name", label: "Name", sortable: true, hideable: true, draggable: true },
  { key: "email", label: "Email", sortable: true, hideable: true, draggable: true },
  { key: "phone", label: "Phone", sortable: true, hideable: true, draggable: true },
  { key: "societyName", label: "Society Name", sortable: true, hideable: true, draggable: true },
  { key: "message", label: "Message", sortable: false, hideable: true, draggable: true },
  { key: "gateDevice", label: "Gate Device", sortable: true, hideable: true, draggable: true },
];

const SmartsecureIntegration: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("integration");

  const [gates, setGates] = useState<SmartsecureGateRow[]>([]);
  const [loadingGates, setLoadingGates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiryPage, setEnquiryPage] = useState(1);
  const [enquiryTotalPages, setEnquiryTotalPages] = useState(1);
  const [enquiryTotalEntries, setEnquiryTotalEntries] = useState(0);
  const [enquirySearchTerm, setEnquirySearchTerm] = useState("");

  const fetchGates = useCallback(async (page: number = 1, search: string = "") => {
    try {
      setLoadingGates(true);
      const response = await ticketManagementAPI.getSocietyGates(page, 20, search);
      const rawList = response?.smart_secure_society_gates || [];
      const filtered = rawList.filter(isSmartsecureGate);
      setGates(
        filtered.map((gate: any) => ({
          id: gate.id,
          gateName: gate.gate_name,
          gateDevice: gate.gate_device,
          societyName: gate.society?.name || "N/A",
          societyBlockName: gate.society_block?.name || "N/A",
          userName: gate.user?.name || "N/A",
          active: gate.active === 1 || gate.active === true,
        }))
      );
      if (response?.smart_secure_pagination) {
        setCurrentPage(response.smart_secure_pagination.current_page || page);
        setTotalPages(response.smart_secure_pagination.total_pages || 1);
      }
    } catch (error) {
      console.error("Error fetching smartsecure gates:", error);
      toast.error("Failed to load gates. Please try again.");
      setGates([]);
    } finally {
      setLoadingGates(false);
    }
  }, []);

  useEffect(() => {
    fetchGates(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const handleGateSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const fetchEnquiries = useCallback(async (page: number = 1, search: string = "") => {
    try {
      setLoadingEnquiries(true);
      const response = await ticketManagementAPI.getSocietyGateEnquiries(page, 20, search);
      const rawList = response?.enquiries || [];
      setEnquiries(
        rawList.map((enquiry: any, index: number) => ({
          id: (page - 1) * 20 + index + 1,
          name: enquiry.name || "N/A",
          email: enquiry.email || "N/A",
          phone: enquiry.phone || "N/A",
          societyName: enquiry.society_name || "N/A",
          message: enquiry.message || "-",
          gateDevice: enquiry.gate_device || "-",
        }))
      );
      if (response?.pagination) {
        setEnquiryPage(response.pagination.current_page || page);
        setEnquiryTotalPages(response.pagination.total_pages || 1);
        setEnquiryTotalEntries(response.pagination.total_entries || 0);
      }
    } catch (error) {
      console.error("Error fetching society gate enquiries:", error);
      toast.error("Failed to load enquiries. Please try again.");
      setEnquiries([]);
    } finally {
      setLoadingEnquiries(false);
    }
  }, []);

  // Fetch enquiries lazily, only once the Enquiries tab is opened.
  useEffect(() => {
    if (activeTab === "enquiries") {
      fetchEnquiries(enquiryPage, enquirySearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, enquiryPage, enquirySearchTerm]);

  const handleEnquirySearch = (term: string) => {
    setEnquirySearchTerm(term);
    setEnquiryPage(1);
  };

  const handleToggleActive = async (row: SmartsecureGateRow) => {
    const nextActive = !row.active;
    setGates((prev) =>
      prev.map((g) => (g.id === row.id ? { ...g, active: nextActive } : g))
    );
    try {
      await ticketManagementAPI.updateSmartsecureGate(row.id, {
        active: nextActive ? 1 : 0,
      });
      toast.success(`Gate ${nextActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating gate status:", error);
      toast.error("Failed to update gate status.");
      setGates((prev) =>
        prev.map((g) => (g.id === row.id ? { ...g, active: row.active } : g))
      );
    }
  };

  const renderGateCell = (item: SmartsecureGateRow, columnKey: string) => {
    switch (columnKey) {
      case "societyName":
        return item.societyName;
      case "societyBlockName":
        return item.societyBlockName;
      case "userName":
        return item.userName;
      case "gateName":
        return item.gateName;
      case "gateDevice":
        return <span className="font-mono text-sm">{item.gateDevice}</span>;
      case "status":
        return (
          <Switch
            checked={item.active}
            onCheckedChange={() => handleToggleActive(item)}
            className="data-[state=checked]:bg-green-500"
          />
        );
      default:
        return "-";
    }
  };

  const renderGateActions = (item: SmartsecureGateRow) => (
    <button
      onClick={() => navigate(`/ops-console/admin/smartsecure-integration/edit/${item.id}`)}
      className="p-1 hover:bg-gray-100 rounded"
      title="Edit"
    >
      <Edit className="w-4 h-4 text-gray-600 hover:text-[#C72030]" />
    </button>
  );

  const renderEnquiryCell = (item: EnquiryRow, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return item.name;
      case "email":
        return item.email;
      case "phone":
        return item.phone;
      case "societyName":
        return item.societyName;
      case "message":
        return (
          <span className="block max-w-xs truncate" title={item.message}>
            {item.message}
          </span>
        );
      case "gateDevice":
        return <span className="font-mono text-sm">{item.gateDevice}</span>;
      default:
        return "-";
    }
  };

  return (
    <div className="p-6 min-h-screen space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smartsecure Integration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage Smartsecure society gates — Society, Society Block, User and Gate Device.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger
            value="integration"
            className="data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] font-semibold"
          >
            Smartsecure Integration
          </TabsTrigger>
          <TabsTrigger
            value="enquiries"
            className="data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] font-semibold"
          >
            Enquiries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="mt-4">
          <EnhancedTable
            data={gates}
            columns={gateColumns}
            renderCell={renderGateCell}
            renderActions={renderGateActions}
            getItemId={(item) => item.id.toString()}
            leftActions={
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate("/ops-console/admin/smartsecure-integration/add")}
                  className="bg-[#C72030] hover:bg-[#A01928] text-white px-4 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
                {/* <Button
                  onClick={() => fetchGates(currentPage, searchTerm)}
                  disabled={loadingGates}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingGates ? "animate-spin" : ""}`} />
                  Refresh
                </Button> */}
              </div>
            }
            loading={loadingGates}
            loadingMessage="Loading gates..."
            emptyMessage="No smartsecure gates found"
            enableGlobalSearch
            onGlobalSearch={handleGateSearch}
            disableClientSearch
            searchPlaceholder="Search"
            pagination
            manualPagination
            pageSize={20}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            storageKey="smartsecure-gates-table"
          />
        </TabsContent>

        <TabsContent value="enquiries" className="mt-4">
          <EnhancedTable
            data={enquiries}
            columns={enquiryColumns}
            renderCell={renderEnquiryCell}
            getItemId={(item) => item.id.toString()}
            leftActions={
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600 whitespace-nowrap">
                  {enquiryTotalEntries.toLocaleString()} enquir{enquiryTotalEntries === 1 ? "y" : "ies"} total
                </p>
                {/* <Button
                  onClick={() => fetchEnquiries(enquiryPage, enquirySearchTerm)}
                  disabled={loadingEnquiries}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingEnquiries ? "animate-spin" : ""}`} />
                  Refresh
                </Button> */}
              </div>
            }
            loading={loadingEnquiries}
            loadingMessage="Loading enquiries..."
            emptyMessage="No enquiries found"
            enableGlobalSearch
            onGlobalSearch={handleEnquirySearch}
            disableClientSearch
            searchPlaceholder="Search enquiries"
            pagination
            manualPagination
            pageSize={20}
            currentPage={enquiryPage}
            totalPages={enquiryTotalPages}
            onPageChange={setEnquiryPage}
            storageKey="smartsecure-enquiries-table"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartsecureIntegration;
