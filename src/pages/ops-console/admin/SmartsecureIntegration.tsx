import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Edit, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ticketManagementAPI } from "@/services/ticketManagementAPI";

interface SmartsecureGateRow {
  id: number;
  gateName: string;
  gateDevice: string;
  societyName: string;
  societyBlockName: string;
  userName: string;
  active: boolean;
}

// A gate created via the QuikGate flow always has a building attached;
// Smartsecure gates use a society block instead, so we filter on that.
const isSmartsecureGate = (gate: any) =>
  !gate.building_id && !gate.building?.id;

const SmartsecureIntegration: React.FC = () => {
  const navigate = useNavigate();

  const [gates, setGates] = useState<SmartsecureGateRow[]>([]);
  const [loadingGates, setLoadingGates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGates = useCallback(async (page: number = 1) => {
    try {
      setLoadingGates(true);
      const response = await ticketManagementAPI.getSocietyGates(page, 20);
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
    fetchGates(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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

  const filteredGates = gates.filter(
    (item) =>
      item.societyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.societyBlockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.gateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.gateDevice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => navigate("/ops-console/admin/smartsecure-integration/add")}
          className="bg-[#C72030] hover:bg-[#A01928] text-white px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchGates(currentPage)}
            disabled={loadingGates}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingGates ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f6f4ee]">
              <TableHead className="w-20">Actions</TableHead>
              <TableHead className="min-w-[220px]">Society</TableHead>
              <TableHead className="w-40">Society Block</TableHead>
              <TableHead className="w-40">User</TableHead>
              <TableHead className="w-32">Gate Name</TableHead>
              <TableHead className="w-40">Gate Device</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingGates ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Loading gates...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredGates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No smartsecure gates found
                </TableCell>
              </TableRow>
            ) : (
              filteredGates.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <button
                      onClick={() =>
                        navigate(`/ops-console/admin/smartsecure-integration/edit/${item.id}`)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600 hover:text-[#C72030]" />
                    </button>
                  </TableCell>
                  <TableCell>{item.societyName}</TableCell>
                  <TableCell>{item.societyBlockName}</TableCell>
                  <TableCell>{item.userName}</TableCell>
                  <TableCell>{item.gateName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.gateDevice}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => handleToggleActive(item)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            {totalPages > 10 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default SmartsecureIntegration;
