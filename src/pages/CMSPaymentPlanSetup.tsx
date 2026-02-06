import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable'
import { Button } from '@/components/ui/button'
import { ColumnConfig } from '@/hooks/useEnhancedTable'
import axios from 'axios'
import { Edit, Eye, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

    const [paymentPlans, setPaymentPlans] = useState([])

    const fetchPaymentPlans = async () => {
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
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchPaymentPlans()
    }, [])

    const renderActions = (row: any) => {
        return (
            <Button variant='ghost' size='sm' onClick={() => navigate(`/cms/payment-plan-setup/${row.id}`)}>
                <Eye className='w-4 h-4' />
            </Button>
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
                data={paymentPlans || []}
                columns={columns}
                renderActions={renderActions}
                leftActions={
                    <Button onClick={() => navigate('/cms/payment-plan-setup/add')}>
                        <Plus className='w-4 h-4' />
                        Add
                    </Button>
                }
                renderCell={renderCell}
            />
        </div>
    )
}

export default CMSPaymentPlanSetup