import React, { useEffect, useState, useCallback } from "react";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem, Chip, Box } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import SelectBox from "../components/ui/select-box";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface User {
  name: string;
  email: string;
}

interface OrderItem {
  product_name: string;
}

interface Order {
  id: number;
  order_number: string;
  user: User;
  status: string;
  payment_status: string;
  total_amount: number;
  loyalty_points_redeemed: number;
  total_items: number;
  order_items: OrderItem[];
  created_at: string;
}

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total_count: 0,
    pagination_available: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>([]);
  const [orderDateFilter, setOrderDateFilter] = useState('last_30_days');
  const [orderDateOptions, setOrderDateOptions] = useState([
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
  ]);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Refunded", value: "refunded" },
  ];

  const paymentStatusOptions = [
    { label: "All Payment Statuses", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Partially Paid", value: "partially_paid" },
    { label: "Failed", value: "failed" },
    { label: "Refunded", value: "refunded" },
  ];

  const fetchOrders = useCallback(
    async (
      page: number,
      search: string,
      status: string[] | string,
      paymentStatus: string[] | string,
      orderDate: string
    ) => {
      setLoading(true);
      setIsSearching(
        !!search ||
        (Array.isArray(status) ? status.length > 0 : !!status) ||
        (Array.isArray(paymentStatus) ? paymentStatus.length > 0 : !!paymentStatus) ||
        !!orderDate
      );
      try {
        // Build query params for API
        const token = API_CONFIG.TOKEN || "";
        const params = new URLSearchParams();
        params.append("token", token);
        params.append("page", page.toString());
        params.append("order_date", orderDate || "last_30_days");

        if (search) {
          params.append("search", search);
        }

        if (Array.isArray(status) && status.length > 0) {
          status.forEach((s) => params.append("status[]", s));
        } else if (typeof status === "string" && status) {
          params.append("status", status);
        }

        if (Array.isArray(paymentStatus) && paymentStatus.length > 0) {
          paymentStatus.forEach((s) => params.append("payment_status[]", s));
        } else if (typeof paymentStatus === "string" && paymentStatus) {
          params.append("payment_status", paymentStatus);
        }

        const url = getFullUrl(`/admin/orders.json?${params.toString()}`);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        const data = await response.json();
        const ordersData = data.orders || [];

        // Calculate total_pages from API response
        const totalPages = Math.ceil(
          (data.pagination?.total_count || data.total_count || 0) /
          (data.pagination?.per_page || data.per_page || 20)
        );

        setOrders(ordersData);
        setPagination({
          current_page: data.pagination?.current_page || data.current_page || page,
          per_page: data.pagination?.per_page || data.per_page || 20,
          total_count: data.pagination?.total_count || data.total_count || 0,
          pagination_available: data.pagination?.pagination_available || data.pagination_available || false,
        });
      } catch (error) {
        toast.error("Failed to fetch orders");
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders(
      pagination.current_page,
      searchTerm,
      statusFilter,
      paymentStatusFilter,
      orderDateFilter
    );
  }, [
    pagination.current_page,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    orderDateFilter,
    fetchOrders,
  ]);

  // Fetch filter options for order date dropdown
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const token = API_CONFIG.TOKEN || "";
        const response = await fetch(
          getFullUrl(`/orders/filter_options.json?token=${token}`),
          { headers: { Authorization: getAuthHeader() } }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.order_date_filters) {
          setOrderDateOptions(
            data.order_date_filters.map((opt) => ({
              value: opt.key,
              label: opt.label,
            }))
          );
        }
      } catch (e) { }
    }
    fetchFilterOptions();
  }, []);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const calculateTotalPages = () => {
    return Math.ceil(pagination.total_count / pagination.per_page) || 1;
  };

  const handlePageChange = (page: number) => {
    const totalPages = calculateTotalPages();
    if (page < 1 || page > totalPages || page === pagination.current_page || loading) {
      return;
    }
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

  const renderPaginationItems = () => {
    const totalPages = calculateTotalPages();
    if (!totalPages || totalPages <= 0) {
      return null;
    }

    const items = [];
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

  const updateOrderStatus = async (
    orderId: number,
    newStatus: string,
    notes = ""
  ) => {
    setUpdatingStatus(orderId);
    try {
      // const url = getFullUrl(`/orders/${orderId}/status_update.json?status=${newStatus}&notes=${encodeURIComponent(notes)}`);
      const token = API_CONFIG.TOKEN || "";
      const url = getFullUrl(`/admin/orders/${orderId}/status_update.json?status=${newStatus}&notes=${encodeURIComponent(notes)}&token=${token}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update order status: ${response.statusText}`
        );
      }

      toast.success('Order status updated successfully!');
      fetchOrders(pagination.current_page, searchTerm, statusFilter, paymentStatusFilter, orderDateFilter);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    const notes = prompt("Enter notes for status update (optional):");
    if (notes !== null) {
      updateOrderStatus(orderId, newStatus, notes);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      partially_paid: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return statusClasses[status] || "bg-gray-100 text-gray-800";
  };

  const columns = [
    { key: "id", label: "Order ID", sortable: true },
    { key: "order_number", label: "Order Number", sortable: true },
    { key: "customer", label: "Customer", sortable: false },
    { key: "status", label: "Status", sortable: true },
    { key: "payment_status", label: "Payment Status", sortable: true },
    { key: "total_amount", label: "Total Amount", sortable: true },
    { key: 'loyalty_points_redeemed', label: 'Points Redeemed', sortable: true },
    { key: "items", label: "Items", sortable: false },
    { key: "created_at", label: "Created At", sortable: true },
  ];

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://${localStorage.getItem('baseUrl')}/organization_wallet/export_transactions.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "orders_transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
      toast.error("Failed to export users")
    }
  }

  const renderListTab = () => (
    <div className="space-y-4">
      {renderCustomFilters()}
      <EnhancedTable
        data={orders}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        handleExport={handleExport}
        exportFileName="orders"
        storageKey="orders-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search orders (ID, number, customer name/email)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching orders..." : "Loading orders..."}
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
                onClick={() => handlePageChange(Math.min(calculateTotalPages(), pagination.current_page + 1))}
                className={pagination.current_page === calculateTotalPages() || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );

  const renderCell = (item: Order, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return (
          <span
            className="font-medium text-[#C72030] cursor-pointer hover:underline"
            onClick={() => navigate(`/loyalty/orders/${item.id}`)}
          >
            {item.id}
          </span>
        );
      case "order_number":
        return (
          <span
            className="text-sm"
          >
            {item.order_number || "-"}
          </span>
        );
      case "customer":
        return (
          <div>
            <div className="font-medium text-gray-900">
              {item.user?.name || "N/A"}
            </div>
            <div className="text-sm text-gray-500">
              {item.user?.email || "-"}
            </div>
          </div>
        );
      case "status":
        return (
          <div className="w-[170px]">
            <SelectBox
              label=""
              options={statusOptions.filter((opt) => opt.value !== "")}
              defaultValue={item.status}
              onChange={(value) => handleStatusChange(item.id, value)}
            />
            {updatingStatus === item.id && (
              <div className="mt-1 text-xs text-gray-500">Updating...</div>
            )}
          </div>
        );
      case "payment_status":
        const paymentStatus = item.payment_status || "";
        const displayStatus =
          paymentStatus.charAt(0).toUpperCase() +
          paymentStatus.slice(1).replace("_", " ");
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(paymentStatus)}`}
          >
            {displayStatus || "N/A"}
          </span>
        );
      case "total_amount":
        return (
          <span className="font-semibold">
            ₹{parseFloat(item.total_amount?.toString() || "0").toFixed(2)}
          </span>
        );
      case "loyalty_points_redeemed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {parseFloat(item.total_amount?.toString() || "0").toFixed(2)} pts
          </span>
        );
      case "items":
        return (
          <div>
            <div className="font-medium">{item.total_items || 0} item(s)</div>
            {item.order_items?.length > 0 && (
              <div className="text-sm text-gray-500 truncate max-w-[150px]">
                {item.order_items[0].product_name}
                {item.order_items.length > 1 &&
                  ` +${item.order_items.length - 1} more`}
              </div>
            )}
          </div>
        );
      case "created_at":
        return (
          <span className="text-sm text-gray-600">
            {formatDate(item.created_at)}
          </span>
        );
      default:
        return (item[columnKey as keyof Order] as React.ReactNode) ?? "-";
    }
  };

  const renderCustomFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Clear Filter Button */}
      <div className="col-span-3 flex justify-end mb-2">
        <button
          className="px-4 py-2 bg-[#C72030] text-white rounded hover:bg-[#A01828] transition-colors"
          onClick={() => {
            setStatusFilter([]);
            setPaymentStatusFilter([]);
            setOrderDateFilter("last_30_days");
            setSearchTerm("");
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          }}
        >
          Clear Filter
        </button>
      </div>
      <FormControl fullWidth variant="outlined">
        <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Status Filter</InputLabel>
        <MuiSelect
          multiple
          value={statusFilter}
          onChange={(e) => {
            const values = e.target.value as string[];
            setStatusFilter(values);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          }}
          displayEmpty
          label="Status Filter"
          sx={fieldStyles}
          MenuProps={menuProps}
          renderValue={(selected: string[]) =>
            selected.length ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={statusOptions.find((o) => o.value === value)?.label || value} size="small" />
                ))}
              </Box>
            ) : (
              <em>Select Status...</em>
            )
          }
        >
          {statusOptions.filter((opt) => opt.value !== "").map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>

      <FormControl fullWidth variant="outlined">
        <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Payment Status</InputLabel>
        <MuiSelect
          multiple
          value={paymentStatusFilter}
          onChange={(e) => {
            const values = e.target.value as string[];
            setPaymentStatusFilter(values);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          }}
          displayEmpty
          label="Payment Status"
          sx={fieldStyles}
          MenuProps={menuProps}
          renderValue={(selected: string[]) =>
            selected.length ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={paymentStatusOptions.find((o) => o.value === value)?.label || value} size="small" />
                ))}
              </Box>
            ) : (
              <em>Select Payment Status...</em>
            )
          }
        >
          {paymentStatusOptions.filter((opt) => opt.value !== "").map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>

      <FormControl fullWidth variant="outlined">
        <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Order Date</InputLabel>
        <MuiSelect
          value={orderDateFilter}
          onChange={(e) => {
            setOrderDateFilter(e.target.value || "last_30_days");
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          }}
          displayEmpty
          label="Order Date"
          sx={fieldStyles}
          MenuProps={menuProps}
        >
          <MenuItem value=""><em>Select Date Range...</em></MenuItem>
          {orderDateOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>
    </div>)


  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">ORDERS ({pagination.total_count} total)</h1>
      </div>
      {renderListTab()}
    </div>
  );
};

export default OrdersList;
