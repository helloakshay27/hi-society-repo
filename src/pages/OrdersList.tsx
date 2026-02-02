import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import SelectBox from '../components/ui/select-box';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { useNavigate } from 'react-router-dom';

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
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
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

  const fetchOrders = useCallback(async (page: number, search: string, status: string, paymentStatus: string) => {
    setLoading(true);
    setIsSearching(!!search || !!status || !!paymentStatus);
    try {
      // Use baseurl and token as done for updateOrderStatus
      const url = `https://runwal-api.lockated.com/admin/orders.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      const ordersData = data.orders || [];
      setAllOrders(ordersData);

      // Client-side filtering
      let filteredOrders = ordersData;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredOrders = filteredOrders.filter((order: Order) =>
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.user?.name?.toLowerCase().includes(searchLower) ||
          order.user?.email?.toLowerCase().includes(searchLower) ||
          order.id?.toString().toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (status) {
        filteredOrders = filteredOrders.filter((order: Order) => order.status === status);
      }

      // Payment status filter
      if (paymentStatus) {
        filteredOrders = filteredOrders.filter((order: Order) => order.payment_status === paymentStatus);
      }

      // Client-side pagination
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredOrders.length / itemsPerPage));
      setTotalCount(filteredOrders.length);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage, searchTerm, statusFilter, paymentStatusFilter);
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter, fetchOrders]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, notes = '') => {
    setUpdatingStatus(orderId);
    try {
      // const url = getFullUrl(`/orders/${orderId}/status_update.json?status=${newStatus}&notes=${encodeURIComponent(notes)}`);
      const url = `https://runwal-api.lockated.com/orders/${orderId}/status_update.json?status=${newStatus}&notes=${encodeURIComponent(notes)}&token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.statusText}`);
      }

      toast.success('Order status updated successfully!');
      fetchOrders(currentPage, searchTerm, statusFilter, paymentStatusFilter);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    const notes = prompt('Enter notes for status update (optional):');
    if (notes !== null) {
      updateOrderStatus(orderId, newStatus, notes);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'order_number', label: 'Order Number', sortable: true },
    { key: 'customer', label: 'Customer', sortable: false },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'payment_status', label: 'Payment Status', sortable: true },
    { key: 'total_amount', label: 'Total Amount', sortable: true },
    { key: 'loyalty_points_redeemed', label: 'Points Used', sortable: true },
    { key: 'items', label: 'Items', sortable: false },
    { key: 'created_at', label: 'Created At', sortable: true },
  ];

  const renderCell = (item: Order, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return (
          <span 
            className="font-medium text-[#C72030] cursor-pointer hover:underline"
            onClick={() => navigate(`/loyalty/orders/${item.id}`)}
          >
            {item.id}
          </span>
        );
      case 'order_number':
        return (
          <span 
            className="text-sm text-[#C72030] cursor-pointer hover:underline"
            onClick={() => navigate(`/orders/${item.id}`)}
          >
            {item.order_number || '-'}
          </span>
        );
      case 'customer':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.user?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{item.user?.email || '-'}</div>
          </div>
        );
      case 'status':
        return (
          <div>
            <SelectBox
              label=""
              options={statusOptions.filter(opt => opt.value !== '')}
              defaultValue={item.status}
              onChange={(value) => handleStatusChange(item.id, value)}
            />
            {updatingStatus === item.id && (
              <div className="mt-1 text-xs text-gray-500">Updating...</div>
            )}
          </div>
        );
      case 'payment_status':
        const paymentStatus = item.payment_status || '';
        const displayStatus = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).replace('_', ' ');
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(paymentStatus)}`}>
            {displayStatus || 'N/A'}
          </span>
        );
      case 'total_amount':
        return <span className="font-semibold">₹{parseFloat(item.total_amount?.toString() || '0').toFixed(2)}</span>;
      case 'loyalty_points_redeemed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {(item.loyalty_points_redeemed || 0).toLocaleString()} pts
          </span>
        );
      case 'items':
        return (
          <div>
            <div className="font-medium">{item.total_items || 0} item(s)</div>
            {item.order_items?.length > 0 && (
              <div className="text-sm text-gray-500 truncate max-w-[150px]">
                {item.order_items[0].product_name}
                {item.order_items.length > 1 && ` +${item.order_items.length - 1} more`}
              </div>
            )}
          </div>
        );
      case 'created_at':
        return <span className="text-sm text-gray-600">{formatDate(item.created_at)}</span>;
      default:
        return item[columnKey as keyof Order] as React.ReactNode ?? '-';
    }
  };

  const renderCustomFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Status Filter</label>
        <SelectBox
          label=""
          options={statusOptions}
          defaultValue={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Payment Status</label>
        <SelectBox
          label=""
          options={paymentStatusOptions}
          defaultValue={paymentStatusFilter}
          onChange={(value) => {
            setPaymentStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      {renderCustomFilters()}
      <EnhancedTable
        data={orders}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="orders"
        storageKey="orders-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search orders (ID, number, customer name/email)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching orders..." : "Loading orders..."}
      />
      {!searchTerm && !statusFilter && !paymentStatusFilter && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">ORDERS ({totalCount} total)</h1>
      </div>
      {renderListTab()}
    </div>
  );
};

export default OrdersList;
