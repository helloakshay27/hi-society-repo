import React, { useState, useEffect } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
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
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // API data for customers
    const [customersData, setCustomersData] = useState<any[]>([]);
    const [allCustomersData, setAllCustomersData] = useState<any[]>([]);
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const token = API_CONFIG.TOKEN || "";
                const url = getFullUrl(`/loyalty/members?token=${token}`);
                const res = await fetch(url, { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } });
                const data = await res.json();
                // Map API data to table row format
                const mappedData = (Array.isArray(data) ? data : []).map((item) => ({
                    id: item.id,
                    customerId: item.user_id,
                    customerName: `${item.firstname || ""} ${item.lasttname || ""}`.trim(),
                    tierLevel: item.member_status?.tier_level || "-",
                    tierValidity: item.tier_validity || "-",
                    websites: item.email || "-",
                    dateJoined: item.joining_date || "-",
                }));
                setAllCustomersData(mappedData);
                setTotalCount(mappedData.length);
                setTotalPages(Math.ceil(mappedData.length / ITEMS_PER_PAGE) || 1);
                setCurrentPage(1);
                setCustomersData(mappedData.slice(0, ITEMS_PER_PAGE));
            } catch (e) {
                setAllCustomersData([]);
                setCustomersData([]);
                setTotalCount(0);
                setTotalPages(1);
                setCurrentPage(1);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
                            onClick={() => handleView(item.id)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
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
        setCurrentPage(page);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        setCustomersData(allCustomersData.slice(startIndex, startIndex + ITEMS_PER_PAGE));
    };

    const renderPaginationItems = () => {
        if (!totalPages || totalPages <= 0) return null;
        const items = [];
        const showEllipsis = totalPages > 7;
        if (showEllipsis) {
            items.push(
                <PaginationItem key={1} className="cursor-pointer">
                    <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1} className={loading ? "pointer-events-none opacity-50" : ""}>1</PaginationLink>
                </PaginationItem>
            );
            if (currentPage > 4) {
                items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
            } else {
                for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
                    items.push(
                        <PaginationItem key={i} className="cursor-pointer">
                            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>{i}</PaginationLink>
                        </PaginationItem>
                    );
                }
            }
            if (currentPage > 3 && currentPage < totalPages - 2) {
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    items.push(
                        <PaginationItem key={i} className="cursor-pointer">
                            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>{i}</PaginationLink>
                        </PaginationItem>
                    );
                }
            }
            if (currentPage < totalPages - 3) {
                items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
            } else {
                for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
                    if (!items.find((item) => item.key === i.toString())) {
                        items.push(
                            <PaginationItem key={i} className="cursor-pointer">
                                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>{i}</PaginationLink>
                            </PaginationItem>
                        );
                    }
                }
            }
            if (totalPages > 1) {
                items.push(
                    <PaginationItem key={totalPages} className="cursor-pointer">
                        <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages} className={loading ? "pointer-events-none opacity-50" : ""}>{totalPages}</PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i} className="cursor-pointer">
                        <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>{i}</PaginationLink>
                    </PaginationItem>
                );
            }
        }
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
                {totalPages > 1 && (
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
                )}
            </div>
        </div>
    );
};

export default LoyaltyCustomers;
