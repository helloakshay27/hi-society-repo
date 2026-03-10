import { Edit, Printer, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  MenuItem,
  Select as MuiSelect,
  Typography,
  Box,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { toast } from "sonner";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { CMSPaymentsFilterModal } from "@/components/CMSPaymentsFilterModal";
import { format, parse } from "date-fns";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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

const fieldStyles = {
  height: "40px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "40px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
};

const CMSPayments = () => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')
  const societyId = localStorage.getItem("selectedUserSociety");
  const [payments, setPayments] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Modal State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    type: "FacilityBooking", // Default to Facility Booking
    tower_id: "",
    flat_id: "",
    item_id: "", // Booking ID or Member ID
  })

  const [towers, setTowers] = useState([])
  const [flats, setFlats] = useState([])
  const [items, setItems] = useState([]) // Bookings or Members

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_count: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchPayments = async (filterParams = appliedFilters, pageNum: number = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum };

      if (filterParams.status) {
        params["q[payment_status_in]"] = filterParams.status;
      }
      if (filterParams.fromDate && filterParams.toDate) {
        const fromDate = format(parse(filterParams.fromDate, "yyyy-MM-dd", new Date()), "MM/dd/yyyy");
        const toDate = format(parse(filterParams.toDate, "yyyy-MM-dd", new Date()), "MM/dd/yyyy");
        params["q[date_range]"] = `${fromDate} - ${toDate}`;
      }

      const response = await axios.get(`https://${baseUrl}/crm/admin/facility_bookings/payment_details.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      })
      setPayments(response.data.payments);
      if (response.data.meta) {
        setPagination({
          current_page: response.data.meta.current_page || 1,
          total_count: response.data.meta.total_entries || 0,
          total_pages: response.data.meta.total_pages || 0,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }

  const handleFilterApply = (filters: any) => {
    setAppliedFilters(filters);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    fetchPayments(filters, 1);
  };

  useEffect(() => {
    fetchPayments()
    fetchTowers()
  }, [])

  const fetchTowers = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTowers(response.data.society_blocks);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchFlats = async (towerId: string) => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/society_blocks/${towerId}/flats.json?q[active_eq]=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFlats(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchItems = async (flatId: string, type: string) => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/facility_bookings/get_club_details.json?society_flat_id=${flatId}&payment_type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (type === "FacilityBooking") {
        setItems(response.data.details.map((b: any) => ({
          id: b.id,
          label: b.formatted_user_name
        })))
      } else {
        setItems(response.data.details.map((m: any) => ({
          id: m.id,
          label: m.formatted_user_name
        })))
      }
    } catch (error) {
      console.log(error);
      setItems([])
    }
  }

  useEffect(() => {
    if (editFormData.tower_id) {
      fetchFlats(editFormData.tower_id)
    } else {
      setFlats([])
    }
    setEditFormData(prev => ({ ...prev, flat_id: "", item_id: "" }))
  }, [editFormData.tower_id])

  useEffect(() => {
    if (editFormData.flat_id && editFormData.type) {
      fetchItems(editFormData.flat_id, editFormData.type)
    } else {
      setItems([])
    }
    setEditFormData(prev => ({ ...prev, item_id: "" }))
  }, [editFormData.flat_id, editFormData.type])

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/facility_bookings/payment_details.xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "payment_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
      toast.error("Failed to export payments")
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

  const handleEdit = (item: any) => {
    setSelectedPayment(item)
    // Try to pre-fill if data is available
    setEditFormData({
      type: item.payment_type === "FacilityBooking" ? "FacilityBooking" : "ClubMember",
      tower_id: "",
      flat_id: "",
      item_id: item.lockable_id || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editFormData.item_id) {
      toast.error("Please select a booking or member")
      return
    }

    setIsSubmitting(true)
    try {
      await axios.patch(
        `https://${baseUrl}/crm/admin/facility_bookings/update_payment_details.json`,
        {
          payid: selectedPayment.id,
          payment_type: editFormData.type,
          lock_payment: {
            payment_of_id: editFormData.item_id,
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast.success("Payment record updated successfully")
      setIsEditDialogOpen(false)
      fetchPayments(appliedFilters, pagination.current_page)
    } catch (error) {
      console.error("Error updating payment record:", error)
      toast.error("Failed to update payment record")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > pagination.total_pages || page === pagination.current_page || loading) {
      return;
    }

    try {
      setPagination((prev) => ({ ...prev, current_page: page }));
      await fetchPayments(appliedFilters, page);
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

  const renderActions = (item: any) => (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handlePrint(item.id)}
      >
        <Printer className="w-4 h-4" />
      </Button>
      {item.actions.can_edit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(item)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      )}
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
        data={payments || []}
        columns={columns}
        renderActions={renderActions}
        renderCell={renderCell}
        enableExport
        handleExport={handleExport}
        onFilterClick={() => setIsFilterModalOpen(true)}
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

      <CMSPaymentsFilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        onApply={handleFilterApply}
      />

      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 1.5,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            position: "relative",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Edit Details
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsEditDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "red",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box className="space-y-6">
            <RadioGroup
              row
              name="type"
              value={editFormData.type}
              onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
              sx={{ justifyContent: "start", gap: 2 }}
            >
              <FormControlLabel
                value="FacilityBooking"
                control={<Radio sx={{ color: '#666', '&.Mui-checked': { color: '#C72030' } }} />}
                label="Facility Booking"
              />
              <FormControlLabel
                value="ClubMember"
                control={<Radio sx={{ color: '#666', '&.Mui-checked': { color: '#C72030' } }} />}
                label="Club Member"
              />
            </RadioGroup>

            <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth size="small">
                <MuiSelect
                  name="tower_id"
                  value={editFormData.tower_id}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tower_id: e.target.value as string }))}
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    Select Tower
                  </MenuItem>
                  {towers?.map((tower: any) => (
                    <MenuItem key={tower.id} value={tower.id}>
                      {tower.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth size="small">
                <MuiSelect
                  name="flat_id"
                  value={editFormData.flat_id}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, flat_id: e.target.value as string }))}
                  displayEmpty
                  disabled={!editFormData.tower_id}
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    Select Flat
                  </MenuItem>
                  {flats.map((flat: any) => (
                    <MenuItem key={flat.id} value={flat.id}>
                      {flat.flat_no}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>

            <FormControl fullWidth size="small">
              <MuiSelect
                name="item_id"
                value={editFormData.item_id}
                onChange={(e) => setEditFormData(prev => ({ ...prev, item_id: e.target.value as string }))}
                displayEmpty
                disabled={!editFormData.flat_id}
                sx={fieldStyles}
              >
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                {items.map((item: any) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, borderTop: "1px solid #eee" }}>
          <Button
            onClick={handleEditSubmit}
            disabled={isSubmitting}
            className="bg-[#00A65A] hover:bg-[#008d4c] text-white px-8 py-2 font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CMSPayments;
