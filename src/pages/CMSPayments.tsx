import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import axios from "axios";
import { Edit, Printer } from "lucide-react";
import { useEffect, useState } from "react";

const columns: ColumnConfig[] = [
  {
    key: 'order_id',
    label: 'Order Id',
    sortable: true,
    draggable: true
  },
  {
    key: 'payment_type',
    label: 'Type',
    sortable: true,
    draggable: true
  },
  {
    key: 'booked_by',
    label: 'Booked By',
    sortable: true,
    draggable: true
  },
  {
    key: 'flat',
    label: 'Flat',
    sortable: true,
    draggable: true
  },
  {
    key: 'facility_name',
    label: 'Facility Name',
    sortable: true,
    draggable: true
  },
  {
    key: 'scheduled_on',
    label: 'Scheduled On',
    sortable: true,
    draggable: true
  },
  {
    key: 'total_amount',
    label: 'Total Amount',
    sortable: true,
    draggable: true
  },
  {
    key: 'amount_paid',
    label: 'Amount Paid',
    sortable: true,
    draggable: true
  },
  {
    key: 'payment_status',
    label: 'Payment Status',
    sortable: true,
    draggable: true
  },
  {
    key: 'transaction_id',
    label: 'Transaction Id',
    sortable: true,
    draggable: true
  },
  {
    key: 'refunded_amount',
    label: 'Refunded Amount',
    sortable: true,
    draggable: true
  },
  {
    key: 'paid_on',
    label: 'Paid On',
    sortable: true,
    draggable: true
  }
]

const CMSPayments = () => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')
  const [payments, setPayments] = useState([])

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/facility_bookings/payment_details.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setPayments(response.data.payments)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handleExport = async () => {
    try {

    } catch (error) {
      console.log(error)
    }
  }

  const handlePrint = async (id: string) => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm_facility_bookings/payment_details_pdf?lock_payment_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "payment_details.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
    }
  }

  const renderActions = (item: any) => (
    <div>
      <Button
        variant="ghost"
        size="sm"
      // onClick={() => handleEdit(item)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handlePrint(item.id)}
      >
        <Printer className="w-4 h-4" />
      </Button>
    </div>
  )

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "scheduled_on":
        return item.scheduled_on.time
      case "total_amount":
        return item.amounts.total
      case "amount_paid":
        return item.amounts.paid
      case "refunded_amount":
        return item.amounts.refunded
      default:
        return item[columnKey] || "-"
    }
  }

  return (
    <div className="p-6">
      <EnhancedTable
        data={payments}
        columns={columns}
        renderActions={renderActions}
        renderCell={renderCell}
        enableExport
        handleExport={handleExport}
      />
    </div>
  );
};

export default CMSPayments;
