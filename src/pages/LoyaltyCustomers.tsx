import React, { useState, useEffect } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export const LoyaltyCustomers = () => {
    const navigate = useNavigate();
    const { shouldShow } = useDynamicPermissions();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Current page lives in the URL (?page=N) so it survives refresh/back navigation
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // API data for customers (current page only)
    const [customersData, setCustomersData] = useState<any[]>([]);
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const token = API_CONFIG.TOKEN || "";
                const url = getFullUrl(`/loyalty/members?token=${token}&page=${currentPage}`);
                const res = await fetch(url, { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } });
                const data = await res.json();
                const members = Array.isArray(data?.loyalty_members) ? data.loyalty_members : [];
                // Map API data to table row format
                const mappedData = members.map((item: any) => ({
                    id: item.id,
                    customerId: item.user_id,
                    customerName: `${item.firstname || ""} ${item.lasttname || ""}`.trim(),
                    tierLevel: item.member_status?.tier_level || "-",
                    tierValidity: item.tier_validity || "-",
                    websites: item.email || "-",
                    dateJoined: item.joining_date || "-",
                }));
                setCustomersData(mappedData);
                setTotalCount(data?.pagination?.total_count ?? mappedData.length);
                setTotalPages(data?.pagination?.total_pages || 1);
            } catch (e) {
                setCustomersData([]);
                setTotalCount(0);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, [currentPage]);

    // Define columns for EnhancedTable
    const columns = [
        { key: "actions", label: "Actions", sortable: false },
        { key: "customerId", label: "Customer ID", sortable: true },
        { key: "customerName", label: "Customer Name", sortable: true },
        { key: "tierLevel", label: "Tier Level", sortable: true },
        { key: "websites", label: "Email", sortable: true },
        { key: "dateJoined", label: "Date Joined", sortable: true },
    ];

    const renderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        {shouldShow("Customers", "show") && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
                            onClick={() => handleView(item.id)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        )}
                        {/* <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
                            onClick={() => handleEdit(item.id)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-gray-100"
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button> */}
                    </div>
                );
            case "customerId":
                return <span className="font-medium">{item.customerId || "-"}</span>;
            case "customerName":
                return <span>{item.customerName || "-"}</span>;
            case "tierLevel":
                return <span>{item.tierLevel || "-"}</span>;
            case "tierValidity":
                return <span>{item.tierValidity || "-"}</span>;
            case "websites":
                return <span>{item.websites || "-"}</span>;
            case "dateJoined":
                return <span>{item.dateJoined || "-"}</span>;
            default:
                return null;
        }
    };

    const handleView = (id: number) => {
        console.log("View customer:", id);
        navigate(`/loyalty/customers/${id}`);
    };

    const handleEdit = (id: number) => {
        console.log("Edit customer:", id);
        // navigate(`/loyalty/customers/${id}/edit`);
    };

    const handleDelete = (id: number) => {
        console.log("Delete customer:", id);
        // Show delete confirmation dialog
    };

    const handleGlobalSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage || loading) return;
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("page", String(page));
            return params;
        });
    };

    const renderPaginationItems = () => {
        if (!totalPages || totalPages <= 0) return null;

        // Build a unique, sorted list of pages: first, last, and a window around the current page
        const pages = new Set<number>([1, totalPages]);
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.add(i);
        } else {
            // Near the start show 1-5, near the end show the last 5, otherwise current ±1
            const start = currentPage <= 4 ? 2 : currentPage >= totalPages - 3 ? totalPages - 4 : currentPage - 1;
            const end = currentPage <= 4 ? 5 : currentPage >= totalPages - 3 ? totalPages - 1 : currentPage + 1;
            for (let i = start; i <= end; i++) pages.add(i);
        }
        const sortedPages = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((x, y) => x - y);

        const items: React.ReactNode[] = [];
        sortedPages.forEach((page, idx) => {
            if (idx > 0 && page - sortedPages[idx - 1] > 1) {
                items.push(<PaginationItem key={`ellipsis-${page}`}><PaginationEllipsis /></PaginationItem>);
            }
            items.push(
                <PaginationItem key={page} className="cursor-pointer">
                    <PaginationLink onClick={() => handlePageChange(page)} isActive={currentPage === page} className={loading ? "pointer-events-none opacity-50" : ""}>{page}</PaginationLink>
                </PaginationItem>
            );
        });
        return items;
    };

    const handleExport = () => {
        console.log("Exporting customers data...");
    };

    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            {/* Customers Table */}
            <div className="space-y-4">
                <EnhancedTable
                    storageKey="loyalty-customers-table"
                    data={customersData}
                    columns={columns}
                    renderCell={renderCell}
                    enableExport={false}
                    enableGlobalSearch={true}
                    handleExport={handleExport}
                    loading={loading}
                    loadingMessage="Loading customers..."
                    emptyMessage="No customers found"
                />
                <div className="flex flex-col items-center gap-2 mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className={currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                            {renderPaginationItems()}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className={currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                    <p className="text-sm text-gray-600">
                        Showing page {currentPage} of {totalPages} ({totalCount} total customers)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyCustomers;
