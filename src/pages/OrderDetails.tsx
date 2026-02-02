import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Settings, ShoppingCart, Package, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OrderDetails = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);

    // API data for order details
    const [orderData, setOrderData] = useState<any | null>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchDetails = async () => {
            try {
                const url = `https://runwal-api.lockated.com/admin/orders/${id}.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
                const res = await fetch(url);
                const response = await res.json();
                const data = response.order; // Extract the order object
                
                setOrderData({
                    id: data.id,
                    orderNumber: data.order_number || "-",
                    customerName: data.user 
                        ? `${data.user.firstname || ''} ${data.user.lastname || ''}`.trim() || "-"
                        : "-",
                    customerEmail: data.user?.email || "-",
                    customerPhone: data.user?.mobile || "-",
                    status: data.status || "-",
                    paymentStatus: data.payment_status || "-",
                    paymentMethod: data.payment_method || "-",
                    totalAmount: data.total_amount ?? "-",
                    subtotal: data.subtotal_amount ?? "-",
                    taxAmount: data.tax_amount ?? "-",
                    discountAmount: data.discount_amount ?? "-",
                    shippingCost: data.shipping_amount ?? "-",
                    loyaltyPointsRedeemed: data.loyalty_points_redeemed ?? "-",
                    loyaltyPointsValue: data.loyalty_discount_amount ?? "-",
                    loyaltyPointsEarned: data.loyalty_points_earned ?? "-",
                    totalItems: data.total_items ?? "-",
                    shippingAddress: data.shipping_address
                        ? `${data.shipping_address.address || ''}, ${data.shipping_address.address_line_two || ''}, ${data.shipping_address.city || ''}, ${data.shipping_address.state || ''}, ${data.shipping_address.country || ''} - ${data.shipping_address.pin_code || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
                        : "-",
                    billingAddress: data.billing_address
                        ? `${data.billing_address.address || ''}, ${data.billing_address.address_line_two || ''}, ${data.billing_address.city || ''}, ${data.billing_address.state || ''}, ${data.billing_address.country || ''} - ${data.billing_address.pin_code || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
                        : "-",
                    shippingContact: data.shipping_address?.contact_person || "-",
                    shippingMobile: data.shipping_address?.mobile || "-",
                    billingContact: data.billing_address?.contact_person || "-",
                    billingMobile: data.billing_address?.mobile || "-",
                    createdAt: data.created_at || "-",
                    updatedAt: data.updated_at || "-",
                    notes: data.notes || "-",
                });

                setOrderItems(
                    Array.isArray(data.order_items)
                        ? data.order_items.map((item: any, idx: number) => ({
                              id: item.id || idx,
                              productName: item.item_name || item.product?.name || "-",
                              sku: item.product?.sku || "-",
                              quantity: item.quantity ?? "-",
                              price: item.unit_price ?? "-",
                              subtotal: item.unit_price ?? "-",
                              taxAmount: "0.0",
                              total: item.total_price ?? "-",
                              loyaltyPointsEarned: item.loyalty_points_earned ?? "-",
                          }))
                        : []
                );
            } catch (e) {
                console.error("Error fetching order details:", e);
                setOrderData(null);
                setOrderItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    // Order Items Table Columns
    const orderItemsColumns = [
        { key: "productName", label: "Product Name", sortable: true },
        { key: "sku", label: "SKU", sortable: true },
        { key: "quantity", label: "Quantity", sortable: true },
        { key: "price", label: "Price", sortable: true },
        { key: "subtotal", label: "Subtotal", sortable: true },
        { key: "taxAmount", label: "Tax", sortable: true },
        { key: "total", label: "Total", sortable: true },
    ];

    const renderOrderItemCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "productName":
                return <span>{item.productName}</span>;
            case "sku":
                return <span>{item.sku}</span>;
            case "quantity":
                return <span>{item.quantity}</span>;
            case "price":
                return <span>₹{parseFloat(item.price || 0).toFixed(2)}</span>;
            case "subtotal":
                return <span>₹{parseFloat(item.subtotal || 0).toFixed(2)}</span>;
            case "taxAmount":
                return <span>₹{parseFloat(item.taxAmount || 0).toFixed(2)}</span>;
            case "total":
                return <span className="font-semibold">₹{parseFloat(item.total || 0).toFixed(2)}</span>;
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString === "-") return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleString();
    };

    return (
        <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-600 mb-4">
                Orders &gt; Details
            </div>

            {/* Order Details Card (Always visible) */}
            <div className="w-full bg-white rounded-lg shadow-sm border mb-4">
                <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                            <ShoppingCart className="w-5 h-5 text-[#C72030]" />
                        </div>
                        <h3 className="text-lg font-semibold uppercase text-black">
                            Order Information
                        </h3>
                    </div>
                </div>
                <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Order Number
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.orderNumber || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Customer Name
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.customerName || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Customer Email
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.customerEmail || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Customer Phone
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.customerPhone || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Status
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.status || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Payment Status
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.paymentStatus || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Payment Method
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {orderData?.paymentMethod || "-"}
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                Created At
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                {formatDate(orderData?.createdAt) || "-"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <StatsCard
                    title="Total Amount"
                    value={`₹${parseFloat(orderData?.totalAmount || 0).toFixed(2)}`}
                    icon={
                        <svg
                            className="w-6 h-6 text-[#C72030]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
                <StatsCard
                    title="Subtotal"
                    value={`₹${parseFloat(orderData?.subtotal || 0).toFixed(2)}`}
                    icon={
                        <svg
                            className="w-6 h-6 text-[#C72030]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
                <StatsCard
                    title="Tax Amount"
                    value={`₹${parseFloat(orderData?.taxAmount || 0).toFixed(2)}`}
                    icon={
                        <svg
                            className="w-6 h-6 text-[#C72030]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
                <StatsCard
                    title="Loyalty Points Used"
                    value={orderData?.loyaltyPointsRedeemed ?? "-"}
                    icon={
                        <svg
                            className="w-6 h-6 text-[#C72030]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
            </div> */}

            {/* Tabs UI */}
            <Tabs defaultValue="items" className="w-full mt-6">
                <TabsList className="bg-[#f6f4ee] p-1 h-auto">
                    <TabsTrigger
                        value="items"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#C72030] px-6 py-2"
                    >
                        Order Items
                    </TabsTrigger>
                    <TabsTrigger
                        value="payment"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#C72030] px-6 py-2"
                    >
                        Payment Details
                    </TabsTrigger>
                    <TabsTrigger
                        value="shipping"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#C72030] px-6 py-2"
                    >
                        Shipping Details
                    </TabsTrigger>
                </TabsList>

                {/* Order Items Tab */}
                <TabsContent value="items" className="mt-6">
                    <div className="w-full bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between gap-3 bg-[#FAF7F1] py-3 px-4 border border-[#ECE9E2]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F3EBDD]">
                                    <Package className="w-5 h-5 text-[#C72030]" />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    Order Items
                                </h3>
                            </div>
                        </div>
                        <div className="bg-[#FBFBFA] border border-t-0 border-[#ECE9E2] px-5 py-6">
                            <EnhancedTable
                                data={orderItems}
                                columns={orderItemsColumns}
                                renderCell={renderOrderItemCell}
                                enableExport={false}
                                enableGlobalSearch={false}
                                hideTableSearch={true}
                                hideTableExport={true}
                                hideColumnsButton={true}
                                loading={loading}
                                loadingMessage="Loading order items..."
                                emptyMessage="No items found"
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Payment Details Tab */}
                <TabsContent value="payment" className="space-y-6 mt-6">
                    <div className="w-full bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between gap-3 bg-[#FAF7F1] py-3 px-4 border border-[#ECE9E2]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F3EBDD]">
                                    <CreditCard className="w-5 h-5 text-[#C72030]" />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    Payment Information
                                </h3>
                            </div>
                        </div>
                        <div className="bg-[#FBFBFA] border border-t-0 border-[#ECE9E2] px-5 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Payment Status</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.paymentStatus ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Payment Method</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.paymentMethod ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Subtotal</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        ₹{parseFloat(orderData?.subtotal || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Tax Amount</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        ₹{parseFloat(orderData?.taxAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Discount Amount</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        ₹{parseFloat(orderData?.discountAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Shipping Cost</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        ₹{parseFloat(orderData?.shippingCost || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Loyalty Points Value</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        ₹{parseFloat(orderData?.loyaltyPointsValue || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Total Amount</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        ₹{parseFloat(orderData?.totalAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Shipping Details Tab */}
                <TabsContent value="shipping" className="space-y-6 mt-6">
                    <div className="w-full bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between gap-3 bg-[#FAF7F1] py-3 px-4 border border-[#ECE9E2]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F3EBDD]">
                                    <Package className="w-5 h-5 text-[#C72030]" />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    Shipping & Billing Information
                                </h3>
                            </div>
                        </div>
                        <div className="bg-[#FBFBFA] border border-t-0 border-[#ECE9E2] px-5 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Shipping Address</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.shippingAddress ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Billing Address</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.billingAddress ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Shipping Contact Person</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.shippingContact ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Billing Contact Person</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.billingContact ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Shipping Mobile</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.shippingMobile ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Billing Mobile</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.billingMobile ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Order Notes</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {orderData?.notes ?? "-"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Last Updated</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {formatDate(orderData?.updatedAt) ?? "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OrderDetails
