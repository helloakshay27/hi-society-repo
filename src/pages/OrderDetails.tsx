import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Package, MapPin, CreditCard, User, Award, ArrowLeft, Download } from "lucide-react";

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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

    const formatLogCardDate = (dateString: string) => {
        if (!dateString || dateString === "-") return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (dateOnly.getTime() === todayOnly.getTime()) {
            return "Today";
        } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
    };

    const formatLogTime = (dateString: string) => {
        if (!dateString || dateString === "-") return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    // Create timeline events from order data
    const timelineEvents = React.useMemo(() => {
        const events: Array<{ date: string; status: string; description: string; by?: string }> = [];
        
        if (orderData?.createdAt && orderData.createdAt !== "-") {
            events.push({
                date: orderData.createdAt,
                status: "Order Placed",
                description: "Your order has been placed and is being prepared",
            });
        }

        if (orderData?.status === 'confirmed' || orderData?.status === 'completed') {
            events.push({
                date: orderData.updatedAt || orderData.createdAt,
                status: "Order Confirmed",
                description: "Your order has been confirmed",
            });
        }

        if (orderData?.status === 'shipped' || orderData?.status === 'completed') {
            events.push({
                date: orderData.updatedAt || orderData.createdAt,
                status: "Shipped",
                description: "Your order is on the way",
            });
        }

        if (orderData?.status === 'completed') {
            events.push({
                date: orderData.updatedAt || orderData.createdAt,
                status: "Delivered",
                description: "Order has been delivered",
            });
        }

        return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [orderData]);

    return (
        <div className="p-6 bg-[#fafafa] min-h-screen">
            {/* Header with Back Button and Download Invoice */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
                {/* Back Button and Download Invoice */}
                <div className="flex items-center justify-between mb-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Orders</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Download Invoice
                    </button>
                </div>
                
                {/* Order ID and Date */}
                <div className="mb-3">
                    <p className="text-sm text-gray-600">
                        Order ID: {orderData?.id || "-"} • {orderData?.createdAt && orderData.createdAt !== "-" 
                            ? new Date(orderData.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                            : "-"}
                    </p>
                </div>
                
                {/* Order Number and Status */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Order #{orderData?.orderNumber || "-"}
                    </h1>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                        orderData?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        orderData?.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        orderData?.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        orderData?.status === 'completed' ? 'bg-green-100 text-green-800' :
                        orderData?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {orderData?.status ? orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1) : 'Pending'}
                    </span>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-6">
                            <h2 className="text-lg font-semibold text-[#C72030] mb-6">Order Items</h2>
                            
                            {/* Items List */}
                            <div className="space-y-4 mb-6">
                                {orderItems.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        {/* Image Placeholder */}
                                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs text-gray-400">No image</span>
                                        </div>
                                        
                                        {/* Item Details */}
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 mb-1">SKU: {item.sku}</p>
                                            <p className="font-semibold text-gray-900 mb-1">{item.productName}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                        
                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">₹{parseFloat(item.total || 0).toFixed(0)}</p>
                                            <p className="text-xs text-gray-500">₹{parseFloat(item.price || 0).toFixed(0)} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Summary */}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Subtotal</span>
                                    <span className="text-gray-900">₹{parseFloat(orderData?.subtotal || 0).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Tax</span>
                                    <span className="text-gray-900">₹{parseFloat(orderData?.taxAmount || 0).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Shipping</span>
                                    <span className="text-gray-900">₹{parseFloat(orderData?.shippingCost || 0).toFixed(0)}</span>
                                </div>
                                {parseFloat(orderData?.loyaltyPointsRedeemed || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#C72030]">Points Redeemed</span>
                                        <span className="text-[#C72030]">-{orderData?.loyaltyPointsRedeemed}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-2xl text-gray-900">₹{parseFloat(orderData?.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-6">
                            <h2 className="text-lg font-semibold text-[#C72030] mb-6">Order Timeline</h2>
                            
                            {/* Timeline Items */}
                            <div className="relative">
                                <div className="space-y-[5px]">
                                    {/* Order Placed - Completed */}
                                    <div className="relative flex items-start justify-between py-[10px]">
                                        <div className="flex items-start gap-4">
                                            {/* Green checkmark circle */}
                                            <div className="w-6 h-6 rounded-full border-2 border-green-500 bg-white flex items-center justify-center flex-shrink-0 z-10 relative">
                                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Order Placed</h3>
                                                <p className="text-sm text-gray-600">Your order has been received and is being processed</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">Feb 4, 3:23 PM</span>
                                        {/* Green connecting line to next item */}
                                        <div className="absolute left-[11px] top-[calc(50%+10px)] w-[2px] bottom-[-5px] bg-[#B9F8CF]"></div>
                                    </div>
                                    
                                    {/* Order Confirmed - Pending */}
                                    <div className="relative flex items-start justify-between py-[10px]">
                                        <div className="flex items-start gap-4">
                                            {/* Gray empty circle */}
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex-shrink-0 z-10 relative"></div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-400 mb-1">Order Confirmed</h3>
                                                <p className="text-sm text-gray-400">Payment confirmed, preparing for shipment</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">Pending</span>
                                        {/* Gray connecting line to next item */}
                                        <div className="absolute left-[10px] top-[calc(50%+10px)] w-[2px] bottom-[-5px] bg-gray-200"></div>
                                    </div>
                                    
                                    {/* Shipped - Pending */}
                                    <div className="relative flex items-start justify-between py-[10px]">
                                        <div className="flex items-start gap-4">
                                            {/* Gray empty circle */}
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex-shrink-0 z-10 relative"></div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-400 mb-1">Shipped</h3>
                                                <p className="text-sm text-gray-400">Order has been shipped and is on the way</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">Pending</span>
                                        {/* Gray connecting line to next item */}
                                        <div className="absolute left-[11px] top-[calc(50%+10px)] w-[2px] bottom-[-5px] bg-gray-200"></div>
                                    </div>
                                    
                                    {/* Delivered - Pending - No line after this */}
                                    <div className="relative flex items-start justify-between py-[10px]">
                                        <div className="flex items-start gap-4">
                                            {/* Gray empty circle */}
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex-shrink-0 z-10 relative"></div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-400 mb-1">Delivered</h3>
                                                <p className="text-sm text-gray-400">Order delivered successfully</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">Pending</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-6">
                            <h2 className="text-lg font-semibold text-[#C72030] mb-6">Customer Information</h2>
                            
                            {/* Customer Details */}
                            <div className="space-y-4">
                                {/* Avatar and Name */}
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                                        {orderData?.customerName ? orderData.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{orderData?.customerName || "-"}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#EAB308">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                            <span className="text-sm text-gray-600">Gold Member</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Email */}
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-sm text-gray-900">{orderData?.customerEmail || "-"}</p>
                                    </div>
                                </div>
                                
                                {/* Phone */}
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-sm text-gray-900">{orderData?.customerPhone || "-"}</p>
                                    </div>
                                </div>
                                
                                {/* Address */}
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Address</p>
                                        <p className="text-sm text-gray-900">{orderData?.shippingAddress || "-"}</p>
                                    </div>
                                </div>
                                
                                {/* Total Loyalty Points */}
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-gray-700">Total Loyalty Points</span>
                                        <span className="font-bold text-[#C72030] text-lg">1250 pts</span>
                                    </div>
                                    
                                    {/* Loyalty Points Summary Collapsible */}
                                    <div className="border rounded-lg">
                                        <button className="w-full py-3 px-4 flex items-center justify-start gap-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
                                            <Award className="w-5 h-5 text-purple-600" />
                                            <span>Loyalty Points Summary</span>
                                        </button>
                                        
                                        {/* Expanded Content */}
                                        <div className="px-4 pb-4 space-y-4">
                                            {/* Points Earned and Used */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Points Earned</p>
                                                        <p className="text-2xl font-bold text-green-600">+{orderData?.loyaltyPointsEarned || 17}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Points Used</p>
                                                        <p className="text-2xl font-bold text-red-600">-{orderData?.loyaltyPointsRedeemed || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Net Points */}
                                            <div className="flex justify-between items-center py-2 border-t">
                                                <span className="text-sm text-gray-700">Net Points</span>
                                                <span className="font-bold text-[#C72030]">{orderData?.loyaltyPointsEarned || 17} pts</span>
                                            </div>
                                            
                                            {/* Tier Information */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-1">Current Tier</p>
                                                        <p className="font-bold text-gray-900">Gold</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-1">Next Tier</p>
                                                        <p className="font-bold text-gray-900">Platinum</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full" style={{width: '80%'}}></div>
                                                </div>
                                                <p className="text-xs text-center text-gray-600">250 points to reach Platinum</p>
                                            </div>
                                            
                                            {/* Earned Badge */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                                <p className="text-sm font-medium text-blue-900">🎉 This order earned {orderData?.loyaltyPointsEarned || 17} loyalty points!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Address</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Shipping</p>
                                <p className="text-sm text-gray-600">{orderData?.shippingAddress || "-"}</p>
                                <p className="text-sm text-gray-500 mt-1">{orderData?.shippingContact || "-"}</p>
                                <p className="text-sm text-gray-500">{orderData?.shippingMobile || "-"}</p>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">Billing</p>
                                <p className="text-sm text-gray-600">{orderData?.billingAddress || "-"}</p>
                                <p className="text-sm text-gray-500 mt-1">{orderData?.billingContact || "-"}</p>
                                <p className="text-sm text-gray-500">{orderData?.billingMobile || "-"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">₹{parseFloat(orderData?.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax (GST)</span>
                                <span className="font-medium text-gray-900">₹{parseFloat(orderData?.taxAmount || 0).toFixed(2)}</span>
                            </div>
                            {parseFloat(orderData?.discountAmount || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-medium text-green-600">-₹{parseFloat(orderData?.discountAmount || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium text-gray-900">₹{parseFloat(orderData?.shippingCost || 0).toFixed(2)}</span>
                            </div>
                            {parseFloat(orderData?.loyaltyPointsValue || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Loyalty Discount</span>
                                    <span className="font-medium text-green-600">-₹{parseFloat(orderData?.loyaltyPointsValue || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-lg text-[#C72030]">₹{parseFloat(orderData?.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                <p>Payment: {orderData?.paymentMethod || "-"}</p>
                                <p>Status: <span className={`font-medium ${orderData?.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{orderData?.paymentStatus || "-"}</span></p>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails
 