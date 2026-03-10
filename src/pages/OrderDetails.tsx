import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
    Package,
    MapPin,
    CreditCard,
    User,
    Award,
    ArrowLeft,
    Download,
} from "lucide-react";
import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // API data for order details
    const [orderData, setOrderData] = useState<any | null>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [orderStatusLogs, setOrderStatusLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchDetails = async () => {
            try {
                const token = API_CONFIG.TOKEN || "";
                const baseUrl = localStorage.getItem("baseUrl")
                const url = `https://${baseUrl}/admin/orders/${id}.json?token=${token}`;
                const res = await fetch(url, {
                    headers: { Authorization: getAuthHeader() },
                });
                const response = await res.json();
                const data = response.order; // Extract the order object

                let loyaltyPoints = "-";
                let tierName = "Gold";
                let nextTierName = "Platinum";
                let pointsToNextTier = 250;
                let progress = 0;

                if (data.user && data.user.id) {
                    try {
                        const token = API_CONFIG.TOKEN || "";
                        const baseUrl = localStorage.getItem("baseUrl")
                        const userUrl = `https://${baseUrl}/loyalty/members/${data.user.id}.json?token=${token}`;
                        const userRes = await fetch(userUrl, {
                            headers: { Authorization: getAuthHeader() },
                        });
                        const userData = await userRes.json();
                        loyaltyPoints = userData.current_loyalty_points ?? "-";
                        tierName = userData.member_status?.tier_level || "Gold";
                        nextTierName =
                            userData.member_status?.next_tier_level || "Platinum";
                        pointsToNextTier =
                            userData.member_status?.points_to_next_tier ?? 250;
                        progress = userData.member_status?.tier_progression || 0;
                    } catch (err) {
                        console.error("Error fetching user loyalty points:", err);
                    }
                }

                setOrderData({
                    tierName,
                    nextTierName,
                    pointsToNextTier,
                    progress,
                    customerLoyaltyPoints: loyaltyPoints,
                    id: data.id,
                    orderNumber: data.order_number || "-",
                    customerName: data.user
                        ? `${data.user.firstname || ""} ${data.user.lastname || ""}`.trim() ||
                        "-"
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
                        ? `${data.shipping_address.address || ""}, ${data.shipping_address.address_line_two || ""}, ${data.shipping_address.city || ""}, ${data.shipping_address.state || ""}, ${data.shipping_address.country || ""} - ${data.shipping_address.pin_code || ""}`
                            .replace(/,\s*,/g, ",")
                            .replace(/^,\s*|,\s*$/g, "")
                        : "-",
                    billingAddress: data.billing_address
                        ? `${data.billing_address.address || ""}, ${data.billing_address.address_line_two || ""}, ${data.billing_address.city || ""}, ${data.billing_address.state || ""}, ${data.billing_address.country || ""} - ${data.billing_address.pin_code || ""}`
                            .replace(/,\s*,/g, ",")
                            .replace(/^,\s*|,\s*$/g, "")
                        : "-",
                    shippingContact: data.shipping_address?.contact_person || "-",
                    shippingMobile: data.shipping_address?.mobile || "-",
                    billingContact: data.billing_address?.contact_person || "-",
                    billingMobile: data.billing_address?.mobile || "-",
                    createdAt: data.created_at || "-",
                    updatedAt: data.updated_at || "-",
                    notes: data.notes || "-",
                    // the API returns a `total_amount` field which we want to
                    // display in the "Total Redeemed Points" section above.
                    // map it on to a more descriptive key so the UI logic can
                    // remain unchanged.
                    wallet_balance: data.total_amount ?? 0,
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
                            primary_image: item.product?.primary_image || "",
                        }))
                        : []
                );
                setOrderStatusLogs(data.order_status_logs || []);
            } catch (e) {
                console.error("Error fetching order details:", e);
                setOrderData(null);
                setOrderItems([]);
                setOrderStatusLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

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
                return (
                    <span className="font-semibold">
                        ₹{parseFloat(item.total || 0).toFixed(2)}
                    </span>
                );
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

    const formatLogTime = (dateString: string) => {
        if (!dateString || dateString === "-") return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Create timeline events from order data
    const timelineEvents = React.useMemo(() => {
        if (!orderStatusLogs || orderStatusLogs.length === 0) {
            return [];
        }

        return orderStatusLogs
            .map((log: any) => ({
                id: log.id,
                date: log.created_at,
                status: log.status.charAt(0).toUpperCase() + log.status.slice(1),
                description: log.notes || `Order status changed to ${log.status}`,
                by: log.created_by?.id,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [orderStatusLogs]);

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
                    {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#C72030] rounded-md text-sm font-medium hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Download Invoice
                    </button> */}
                </div>



                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-[#fbfbf8] rounded-lg shadow-sm border">
                            <div className="px-6 py-6">
                                <h1 className="text-[#C72030] font-semibold mb-6">Order Items</h1>

                                {/* Items List */}
                                <div className="space-y-4 mb-6">
                                    {orderItems.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            {/* Image Placeholder */}
                                            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                                <img src={item?.primary_image} alt={item.productName} className="w-full h-full object-cover rounded" />
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

                                    {/* show points redeemed unconditionally below shipping */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#C72030]">Points Redeemed</span>
                                        <span className="text-[#C72030]">-{parseFloat(orderData?.loyaltyPointsRedeemed || 0)}</span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="font-bold text-2xl text-gray-900">₹{parseFloat(orderData?.totalAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="bg-[#fbfbf8] rounded-lg shadow-sm border">
                            <div className="px-6 py-6">
                                <h1 className="font-semibold text-[#C72030] mb-6">Order Timeline</h1>

                                {/* Timeline Items */}
                                <div className="relative">
                                    <div className="space-y-0">
                                        {timelineEvents.map((event, index) => {
                                            const isLast = index === timelineEvents.length - 1;
                                            const dateObj = new Date(event.date);
                                            const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                            const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                                            return (
                                                <div key={event.id || index} className="relative flex items-start justify-between py-4">
                                                    <div className="flex items-start gap-4">
                                                        {/* Status Indicator */}
                                                        <div className="w-6 h-6 rounded-full border-2 border-green-500 bg-white flex items-center justify-center flex-shrink-0 z-10 relative">
                                                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-900 mb-1">{event.status}</h3>
                                                            <p className="text-sm text-gray-600">{event.description}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                                                        {formattedDate}, {formattedTime}
                                                    </span>
                                                    {/* Connecting line to next item */}
                                                    {!isLast && (
                                                        <div className="absolute left-[11px] top-[calc(0%+40px)] w-[2px] h-[calc(100%-24px)] bg-[#B9F8CF]"></div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {timelineEvents.length === 0 && (
                                            <p className="text-gray-500 text-center py-4">No status updates available.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Customer Information */}
                        <div className="bg-[#fbfbf8] rounded-lg shadow-sm border">
                            <div className="px-6 py-6">
                                <h1 className="font-semibold text-[#C72030] mb-6">Customer Information</h1>

                                {/* Customer Details */}
                                <div className="space-y-4">
                                    {/* Avatar and Name */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                                            {orderData?.customerName ? orderData.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{orderData?.customerName || "-"}</h3>
                                            <div className="flex items-center gap-1 mt-1 p-1" style={{ border: '2px solid #99999957', borderRadius: "2px", width: 'fit-content' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M19.3588 9.67942C19.3588 15.0251 15.0252 19.3588 9.67938 19.3588C4.3336 19.3588 0 15.0251 0 9.67942C0 4.33361 4.3336 0 9.67938 0C15.0252 0 19.3588 4.33361 19.3588 9.67942Z" fill="url(#paint0_linear_714_3143)" />
                                                    <path d="M17.2343 9.67865C17.2343 13.8515 13.8515 17.2344 9.67872 17.2344C5.50582 17.2344 2.12305 13.8515 2.12305 9.67865C2.12305 5.50581 5.50582 2.12305 9.67872 2.12305C13.8515 2.12305 17.2343 5.50581 17.2343 9.67865Z" fill="#A88300" />
                                                    <path d="M16.7656 9.88248C16.7656 13.9759 13.6316 17.2942 9.76563 17.2942C5.89964 17.2942 2.76562 13.9759 2.76562 9.88248C2.76562 5.78906 5.89964 2.4707 9.76563 2.4707C13.6316 2.4707 16.7656 5.78906 16.7656 9.88248Z" fill="#C28B37" />
                                                    <path d="M17.2519 9.67866C17.2519 13.8613 13.8613 17.2519 9.67872 17.2519C5.49612 17.2519 2.10547 13.8613 2.10547 9.67866C2.10547 5.49612 5.49612 2.10547 9.67872 2.10547C13.8613 2.10547 17.2519 5.49612 17.2519 9.67866Z" fill="#E9B631" />
                                                    <path d="M9.71931 4.41016L11.3529 7.67746L14.6203 8.08587L12.3767 10.6017L12.9867 14.212L9.71931 12.5784L6.45201 14.212L7.06735 10.6017L4.81836 8.08587L8.08569 7.67746L9.71931 4.41016Z" fill="url(#paint1_linear_714_3143)" />
                                                    <defs>
                                                        <linearGradient id="paint0_linear_714_3143" x1="9.02226" y1="3.52793" x2="10.3355" y2="27.9694" gradientUnits="userSpaceOnUse">
                                                            <stop stop-color="#FFC600" />
                                                            <stop offset="1" stop-color="#FFDE69" />
                                                        </linearGradient>
                                                        <linearGradient id="paint1_linear_714_3143" x1="9.71949" y1="4.41016" x2="9.71949" y2="14.212" gradientUnits="userSpaceOnUse">
                                                            <stop stop-color="#FFFCDD" />
                                                            <stop offset="1" stop-color="#FFE896" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <span className="text-sm text-gray-600 font-semibold">Gold Member</span>
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
                                            <span className="text-sm text-gray-700">Total Redeemed Points</span>
                                            <span className="font-bold text-[#C72030] text-lg">{orderData?.wallet_balance || 1250} pts</span>
                                        </div>

                                        {/* <div className="border rounded-lg">
                                        <button className="w-full py-3 px-4 flex items-center justify-start gap-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
                                            <Award className="w-5 h-5 text-purple-600" />
                                            <span className="text-lg text-gray-700">Loyalty Points Summary</span>
                                        </button>

                                        <div className="px-4 pb-4 space-y-4">
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

                                            <div className="flex justify-between items-center py-2 border-t">
                                                <span className="text-sm text-gray-700">Net Points</span>
                                                <span className="font-bold text-[#C72030]">{orderData?.loyaltyPointsEarned || 17} pts</span>
                                            </div>

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

                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                                                </div>
                                                <p className="text-xs text-center text-gray-600">250 points to reach Platinum</p>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                                <p className="text-sm font-medium text-blue-900">🎉 This order earned {orderData?.loyaltyPointsEarned || 17} loyalty points!</p>
                                            </div>
                                        </div>
                                    </div> */}
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
        </div>
    );
};

export default OrderDetails;
