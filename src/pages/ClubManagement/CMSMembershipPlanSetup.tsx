import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable"
import { Button } from "@/components/ui/button"
import { ColumnConfig } from "@/hooks/useEnhancedTable"
import { Edit, Plus } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions"

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

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://${baseUrl}/membership_plans.json`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setPlans(response.data?.plans)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

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
                className="bg-[#C72030] hover:bg-[#B01C29] text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddNew}
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
                data={plans || []}
                columns={columns}
                renderCell={renderCell}
                renderActions={renderActions}
                leftActions={leftActions}
                loading={loading}
            />
        </div>
    )
}

export default CMSMembershipPlanSetup