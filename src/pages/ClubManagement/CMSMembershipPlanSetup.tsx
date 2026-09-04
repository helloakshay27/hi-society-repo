import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable"
import { Button } from "@/components/ui/button"
import { ColumnConfig } from "@/hooks/useEnhancedTable"
import { Edit, Plus } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

const PAGE_SIZE = 10

const columns: ColumnConfig[] = [
    {
        key: 'id',
        label: 'ID',
        sortable: true,
        draggable: true
    },
    {
        key: 'name',
        label: 'Plan Name',
        sortable: true,
        draggable: true
    },
    {
        key: 'price',
        label: 'Price',
        sortable: true,
        draggable: true
    },
    {
        key: 'renewal_terms',
        label: 'Membership Type',
        sortable: true,
        draggable: true
    },
]

const CMSMembershipPlanSetup = () => {
    const navigate = useNavigate()
    const baseUrl = localStorage.getItem("baseUrl")
    const token = localStorage.getItem("token")

    const { shouldShow } = useDynamicPermissions()

    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://${baseUrl}/membership_plans.json`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setPlans(response.data?.plans)
            setCurrentPage(1)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const totalPages = Math.ceil((plans?.length || 0) / PAGE_SIZE) || 1
    const paginatedPlans = (plans || []).slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    )

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const renderPaginationItems = () => {
        if (!totalPages || totalPages <= 0) return null
        const items = []
        const showEllipsis = totalPages > 5

        if (showEllipsis) {
            items.push(
                <PaginationItem key={1} className="cursor-pointer">
                    <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
                        1
                    </PaginationLink>
                </PaginationItem>
            )

            if (currentPage > 4) {
                items.push(
                    <PaginationItem key="ellipsis1">
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            } else {
                for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
                    items.push(
                        <PaginationItem key={i} className="cursor-pointer">
                            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                                {i}
                            </PaginationLink>
                        </PaginationItem>
                    )
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
                    )
                }
            }

            if (currentPage < totalPages - 3) {
                items.push(
                    <PaginationItem key="ellipsis2">
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            } else {
                for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
                    if (!items.find((item) => item.key === i.toString())) {
                        items.push(
                            <PaginationItem key={i} className="cursor-pointer">
                                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                                    {i}
                                </PaginationLink>
                            </PaginationItem>
                        )
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
                )
            }
        } else {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i} className="cursor-pointer">
                        <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
        }

        return items
    }

    const handleAddNew = () => {
        navigate("/cms/membership-plan-setup/add");
    }

    const handleEdit = (plan: any) => {
        navigate(`/cms/membership-plan-setup/edit/${plan.id}`);
    }

    const renderActions = (item: any) => (
        shouldShow("Membership Plan Setup", "update") && (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(item)}
            >
                <Edit className="w-4 h-4" />
            </Button>
        )
    )

    const leftActions = (
        shouldShow("Membership Plan Setup", "create") && (
            <Button
                size="sm"
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"                 onClick={handleAddNew}
            >
                <Plus className="w-4 h-4" />
                Add
            </Button>
        )
    )

    const renderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            default:
                return item[columnKey] || "-"
        }
    }

    return (
        <div className="p-6">
            <EnhancedTable
                data={paginatedPlans}
                columns={columns}
                renderCell={renderCell}
                renderActions={renderActions}
                leftActions={leftActions}
                loading={loading}
            />

            {(plans?.length || 0) > 0 && (
                <div className="mt-6 flex justify-center">
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
    )
}

export default CMSMembershipPlanSetup