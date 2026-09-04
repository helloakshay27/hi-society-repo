import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable'
import { Button } from '@/components/ui/button'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import { ColumnConfig } from '@/hooks/useEnhancedTable'
import axios from 'axios'
import { Edit, Eye, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_SIZE = 10

const columns: ColumnConfig[] = [
    {
        key: "name",
        label: "Plan Name",
        sortable: true,
        draggable: true,
    },
    {
        key: "frequency",
        label: "Frequency",
        sortable: true,
        draggable: true,
    },
    {
        key: "schedules_count",
        label: "Payment Schedules",
        sortable: true,
        draggable: true,
    },
]

const CMSPaymentPlanSetup = () => {
    const navigate = useNavigate()
    const baseUrl = localStorage.getItem("baseUrl")
    const token = localStorage.getItem("token")

    const { shouldShow } = useDynamicPermissions()

    const [paymentPlans, setPaymentPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    const fetchPaymentPlans = async () => {
        setLoading(true)
        try {
            const response = await axios.get(
                `https://${baseUrl}/payment_plans.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            setPaymentPlans(response.data.plans)
            setCurrentPage(1)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPaymentPlans()
    }, [])

    const totalPages = Math.ceil((paymentPlans?.length || 0) / PAGE_SIZE) || 1
    const paginatedPlans = (paymentPlans || []).slice(
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

    const renderActions = (row: any) => {
        return (
            shouldShow("Payment Plan Setup", "update") && (
                <Button variant='ghost' size='sm' onClick={() => navigate(`/cms/payment-plan-setup/${row.id}`)}>
                    <Eye className='w-4 h-4' />
                </Button>
            )
        )
    }

    const renderCell = (item: any, columnKey: string) => {
        if (columnKey === 'frequency') {
            return (
                <span className="capitalize">
                    {item.frequency}
                </span>
            );
        }

        if (columnKey === 'schedules_count') {
            return item.payment_plan_schedules?.length || 0;
        }

        return item[columnKey] || '-';
    };

    return (
        <div className='p-6'>
            <EnhancedTable
                data={paginatedPlans}
                columns={columns}
                renderActions={renderActions}
                leftActions={
                    shouldShow("Payment Plan Setup", "create") && (
                        <Button
                            onClick={() => navigate('/cms/payment-plan-setup/add')}
                            className="bg-[#C72030] hover:bg-[#A01828] !text-white"
                        >
                            <Plus className='w-4 h-4' />
                            Add
                        </Button>
                    )
                }
                renderCell={renderCell}
                loading={loading}
            />

            {(paymentPlans?.length || 0) > 0 && (
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

export default CMSPaymentPlanSetup