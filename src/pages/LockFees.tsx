import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable"
import { Button } from "@/components/ui/button"
import { ColumnConfig } from "@/hooks/useEnhancedTable"
import { Switch } from "@mui/material"
import axios from "axios"
import { Edit, Eye, Plus, RefreshCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

const columns: ColumnConfig[] = [
    {
        key: "sno",
        label: "S.No.",
        sortable: false,
        draggable: false
    },
    {
        key: "module",
        label: "Module",
        sortable: false,
        draggable: false
    },
    {
        key: "display_name",
        label: "Display Name",
        sortable: false,
        draggable: false
    },
    {
        key: "society_id",
        label: "Society ID",
        sortable: false,
        draggable: false
    },
    {
        key: "convinience_charge_type",
        label: "Convinience Charge Type",
        sortable: false,
        draggable: false
    },
    {
        key: "convinience_charge",
        label: "Convinience Charge",
        sortable: false,
        draggable: false
    },
    {
        key: "max_charge",
        label: "Max Charge",
        sortable: false,
        draggable: false
    },
    {
        key: "ccavenue_id",
        label: "CCAVENUE ID",
        sortable: false,
        draggable: false
    },
    {
        key: "start_date",
        label: "Start Date",
        sortable: false,
        draggable: false
    },
    {
        key: "end_date",
        label: "End Date",
        sortable: false,
        draggable: false
    },
    {
        key: "updated_by",
        label: "Updated By",
        sortable: false,
        draggable: false
    },
    {
        key: "status",
        label: "Status",
        sortable: false,
        draggable: false
    },
    {
        key: "visible",
        label: "Visible",
        sortable: false,
        draggable: false
    },
]

const LockFees = () => {
    const baseUrl = localStorage.getItem("baseUrl")
    const token = localStorage.getItem("token")
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const [lockFees, setLockFees] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_entries: 0,
        total_pages: 0,
    })

    // Get page from URL, default to 1
    const currentPageFromUrl = parseInt(searchParams.get("page") || "1", 10)

    const fetchLockFees = async (page: number = 1) => {
        setLoading(true)
        try {
            const response = await axios.get(`https://${baseUrl}/admin/lock_fees.json?page=${page}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })

            setLockFees(response.data.lock_fees || [])
            setPagination(response.data.pagination || {})
        } catch (error) {
            console.error("Error fetching lock fees:", error);
            const message = error.response?.data?.error || "Error fetching lock fees";
            toast.error(message);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLockFees(currentPageFromUrl)
    }, [baseUrl, token, currentPageFromUrl])

    const handlePageChange = async (page: number) => {
        if (page < 1 || page > pagination.total_pages || page === pagination.current_page || loading) {
            return;
        }

        try {
            // Update URL with new page number
            setSearchParams({ page: page.toString() })
            await fetchLockFees(page);
        } catch (error) {
            console.error("Error changing page:", error);
            toast.error("Failed to load page data. Please try again.");
        }
    };

    const renderPaginationItems = () => {
        if (!pagination.total_pages || pagination.total_pages <= 0) {
            return null;
        }
        const items = [];
        const totalPages = pagination.total_pages;
        const currentPage = pagination.current_page;
        const showEllipsis = totalPages > 7;

        if (showEllipsis) {
            items.push(
                <PaginationItem key={1} className="cursor-pointer">
                    <PaginationLink
                        onClick={() => handlePageChange(1)}
                        isActive={currentPage === 1}
                        aria-disabled={loading}
                        className={loading ? "pointer-events-none opacity-50" : ""}
                    >
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
                            <PaginationLink
                                onClick={() => handlePageChange(i)}
                                isActive={currentPage === i}
                                aria-disabled={loading}
                                className={loading ? "pointer-events-none opacity-50" : ""}
                            >
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
                            <PaginationLink
                                onClick={() => handlePageChange(i)}
                                isActive={currentPage === i}
                                aria-disabled={loading}
                                className={loading ? "pointer-events-none opacity-50" : ""}
                            >
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
                                <PaginationLink
                                    onClick={() => handlePageChange(i)}
                                    isActive={currentPage === i}
                                    aria-disabled={loading}
                                    className={loading ? "pointer-events-none opacity-50" : ""}
                                >
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
                        <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            isActive={currentPage === totalPages}
                            aria-disabled={loading}
                            className={loading ? "pointer-events-none opacity-50" : ""}
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i} className="cursor-pointer">
                        <PaginationLink
                            onClick={() => handlePageChange(i)}
                            isActive={currentPage === i}
                            aria-disabled={loading}
                            className={loading ? "pointer-events-none opacity-50" : ""}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        }

        return items;
    };

    const handleToggleStatus = async (id: number, isActive: boolean) => {
        try {
            await axios.post(
                `https://${baseUrl}/admin/update_lock_fees.json`,
                {
                    field: "active",
                    field_value: !isActive ? "1" : "0",
                    id: id,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            toast.success("Status updated successfully");
            setLockFees(lockFees.map((item) => (item.id === id ? { ...item, active: !isActive } : item)))
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    }

    const handleToggleVisibility = async (id: number, isVisible: boolean) => {
        console.log(isVisible)
        try {
            await axios.post(
                `https://${baseUrl}/admin/update_lock_fees.json`,
                {
                    field: "visible",
                    field_value: !isVisible ? "1" : "0",
                    id: id,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            toast.success("Visibility updated successfully");
            setLockFees(lockFees.map((item) => (item.id === id ? { ...item, visible: !isVisible } : item)))
        } catch (error) {
            console.error("Error updating visibility:", error);
            toast.error("Failed to update visibility");
        }
    }

    const handleViewDetails = (id: number) => {
        navigate(`/ops-console/admin/lock-fees/${id}`);
    };

    const handleEdit = (id: number) => {
        navigate(`/ops-console/admin/lock-fees/edit/${id}`);
    };

    const renderActions = (item: any) => {
        return (
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    className="p-1"
                    onClick={() => handleViewDetails(item.id)}
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="p-1"
                    onClick={() => handleEdit(item.id)}
                    title="Edit"
                >
                    <Edit className="w-4 h-4" />
                </Button>
            </div>
        )
    };

    const renderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "sno":
                return (
                    <span className="text-sm text-gray-600 font-medium">
                        {(pagination.current_page - 1) * pagination.total_entries + (lockFees.indexOf(item) + 1)}
                    </span>
                );
            case "society_id":
                return item.fee_for_id || "-";
            case "convinience_charge_type":
                return item.fee_type || "-";
            case "convinience_charge":
                return item.rate || "-";
            case "max_charge":
                return item.maxx || "-";
            case "ccavenue_id":
                return item.cca_sub_account || "-";
            case "start_date":
                return item.start_date || "-";
            case "end_date":
                return item.end_date || "-";
            case "updated_by":
                return item.updated_by_name || "-";
            case "status": {
                const isActive = item.active;
                return (
                    <Switch
                        checked={isActive}
                        onChange={() => handleToggleStatus(item.id, isActive)}
                        color="success"
                        size="small"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#04A231',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#04A231',
                            },
                            '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                                color: '#C72030',
                            },
                            '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                                backgroundColor: 'rgba(199, 32, 48, 0.5)',
                            },
                        }}
                    />
                );
            }
            case "visible": {
                const isVisible = item.visible || false;
                return (
                    <Switch
                        checked={isVisible}
                        onChange={() => handleToggleVisibility(item.id, isVisible)}
                        color="success"
                        size="small"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#04A231',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#04A231',
                            },
                            '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                                color: '#C72030',
                            },
                            '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                                backgroundColor: 'rgba(199, 32, 48, 0.5)',
                            },
                        }}
                    />
                );
            }
            default:
                return item[columnKey] || "-";
        }
    }

    const leftActions = (
        <div className="flex gap-2">
            <Button onClick={() => navigate("/ops-console/admin/lock-fees/add")}>
                <Plus className="w-4 h-4" />
                Add
            </Button>
            {/* <Button
                variant="outline"
                onClick={() => { setSearchParams({ page: "1" }); fetchLockFees(1); }}
            >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
            </Button> */}
        </div>
    )

    return (
        <div className="p-6">
            <EnhancedTable
                data={lockFees}
                columns={columns}
                renderActions={renderActions}
                renderCell={renderCell}
                leftActions={leftActions}
                loading={loading}
            />

            <div className="flex justify-center mt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                                className={pagination.current_page === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                        {renderPaginationItems()}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => handlePageChange(Math.min(pagination.total_pages, pagination.current_page + 1))}
                                className={pagination.current_page === pagination.total_pages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}

export default LockFees