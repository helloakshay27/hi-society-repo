import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable"
import { ColumnConfig } from "@/hooks/useEnhancedTable"
import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
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

const ITEMS_PER_PAGE = 10

interface UserContestReward {
    id: number
    reward_type: string
    status: string
    points_value: number | null
    coupon_code: string
    granted_at: string
    contest: {
        id: number
        name: string
        description: string
        status: string
    }
    prize: {
        id: number
        title: string
        reward_type: string
        product?: {
            name: string
            base_price: string
        }
    }
    user: {
        id: number
        email: string
        firstname: string
        lastname: string
        mobile: string
        full_name: string
    }
}

const columns: ColumnConfig[] = [
    {
        key: "id",
        label: "Claim ID",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "user_name",
        label: "User Name",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "user_mobile",
        label: "Mobile",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "contest_name",
        label: "Contest",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "prize_title",
        label: "Prize",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "product_name",
        label: "Product",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "status",
        label: "Status",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "coupon_code",
        label: "Coupon Code",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
    {
        key: "granted_at",
        label: "Granted At",
        sortable: true,
        draggable: true,
        defaultVisible: true,
    },
]

const Claims = () => {
    const navigate = useNavigate();
    const { shouldShow } = useDynamicPermissions();

    const [claims, setClaims] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    const fetchClaims = async () => {
        setLoading(true)
        try {
            const baseUrl = localStorage.getItem("baseUrl")
            const token = localStorage.getItem("token")

            const response = await axios.get(
                `https://${baseUrl}/user_contest_rewards.json`,
                {
                    params: {
                        token: token,
                        reward_type: "merchandise",
                        access: "admin",
                    },
                }
            )

            // Transform the data to match table structure
            const transformedData = response.data.map((claim: UserContestReward) => ({
                id: claim.id,
                user_name: claim.user.full_name,
                user_mobile: claim.user.mobile,
                user_email: claim.user.email,
                contest_name: claim.contest.name,
                prize_title: claim.prize.title,
                product_name: claim.prize.product?.name || "-",
                status: claim.status.charAt(0).toUpperCase() + claim.status.slice(1),
                coupon_code: claim.coupon_code,
                granted_at: claim.granted_at
                    ? new Date(claim.granted_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : "-",
                reward_type: claim.reward_type,
            }))

            setClaims(transformedData)
            setCurrentPage(1)
        } catch (error) {
            console.error("Error fetching claims:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClaims()
    }, [])

    const renderCell = (row: any, columnKey: string) => {
        switch (columnKey) {
            default:
                return row[columnKey]
        }
    }

    const totalPages = Math.ceil(claims.length / ITEMS_PER_PAGE) || 1
    const paginatedClaims = claims.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const renderPaginationItems = () => {
        if (!totalPages || totalPages <= 0) return null
        const items = []
        const showEllipsis = totalPages > 7

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
            <div className="flex items-center gap-2">
                {shouldShow("Claims", "show") && (
                <Button
                    variant="ghost" size="sm"
                    onClick={() => navigate(`/claims/${row.id}`)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
                )}
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Manage user contest reward claims
                </p>
            </div>
            <EnhancedTable
                data={paginatedClaims}
                columns={columns}
                renderCell={renderCell}
                renderActions={renderActions}
                loading={loading}
                pagination={false}
            />
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
        </div>
    )
}

export default Claims