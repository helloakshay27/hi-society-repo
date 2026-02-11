import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { StatsCard } from "@/components/StatsCard";
import axios from "axios";
import { toast } from "sonner";

interface AggregatorProduct {
    client_price: string;
    customer_price: any;
    id: number;
    aggregator_id: number;
    aggr_product_id: string;
    banner_image_url: string | null;
    name: string;
    sku: string;
    description: string;
    brand: string;
    base_price: string;
    sale_price: string;
    base_amount: number;
    value_type: string | null;
    min_value: string | null;
    max_value: string | null;
    value_denominations: string | null;
    validity: string | null;
    usage_type: string | null;
    phone_required: boolean;
    redemption_fee: string;
    redemption_fee_type: string | null;
    redemption_fee_borne_by_user: boolean;
    terms_and_conditions: string | null;
    redemption_instructions: string | null;
    stock_quantity: number;
    min_stock_level: number;
    published: boolean;
    featured: boolean;
    is_recommended: boolean;
    categories: string | null;
    filter_group_code: string | null;
    shipping_info: string | null;
    origin_country: string;
    created_at: string;
    updated_at: string;
}

export const AggregatorInventoryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<AggregatorProduct | null>(null);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (id) {
            fetchProductDetails();
        }
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const url = `https://runwal-api.lockated.com/aggregator_products/${id}?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
            const response = await axios.get(url);
            const prod = response.data?.data || null;
            setProduct(prod);
            if (prod) {
                setIsActive(prod.published);
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            toast.error("Failed to load product details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-[#fafafa] min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading product details...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6 bg-[#fafafa] min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Product not found</div>
            </div>
        );
    }

    const calculateDiscount = () => {
        const basePrice = parseFloat(product.base_price || "0");
        const salePrice = parseFloat(product.sale_price || "0");
        if (basePrice > 0 && salePrice < basePrice) {
            return Math.round(((basePrice - salePrice) / basePrice) * 100);
        }
        return 0;
    };

    const discount = calculateDiscount();

    return (
        <div className="p-6 bg-[#fafafa] min-h-screen">
            <Toaster position="top-right" richColors closeButton />

            {/* Back Button */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/loyalty/aggregator-inventory')}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Inventory
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Current Stock"
                    value={product.stock_quantity}
                    icon={<Package className="w-6 h-6 text-[#C72030]" />}
                    iconRounded={true}
                    valueColor="text-[#1A1A1A]"
                />
                <StatsCard
                    title="Min Stock Level"
                    value={product.min_stock_level}
                    icon={<ShoppingCart className="w-6 h-6 text-[#C72030]" />}
                    iconRounded={true}
                    valueColor="text-[#1A1A1A]"
                />
                <StatsCard
                    title="Last Order Restocked"
                    value={new Date(product.updated_at).toLocaleDateString()}
                    icon={<Calendar className="w-6 h-6 text-[#C72030]" />}
                    iconRounded={true}
                    valueColor="text-[#1A1A1A]"
                />
            </div>

            {/* Main Layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Images */}
                <div className="flex flex-col w-full md:w-[30%]">
                    {/* <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center"> */}
                    {product.banner_image_url ? (
                        <img
                            src={product.banner_image_url}
                            alt={product.name}
                            className="w-full h-96 object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x320?text=No+Image';
                            }}
                        />
                    ) : (
                        <div className="w-full h-96 flex items-center justify-center text-gray-400">
                            No Image Available
                        </div>
                    )}
                    {/* </div> */}
                    <div className="flex gap-3">
                        {product.featured && (
                            <div className="bg-purple-100 rounded-lg px-4 py-2">
                                <span className="text-sm font-semibold text-purple-700">Featured</span>
                            </div>
                        )}
                        {product.is_recommended && (
                            <div className="bg-yellow-100 rounded-lg px-4 py-2">
                                <span className="text-sm font-semibold text-yellow-700">Recommended</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Right Column - Details */}
                <div className="flex flex-col gap-6 w-full md:w-[70%]">
                    {/* Product Name & Info Card */}
                    <div className="bg-white w-full rounded-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-sm font-semibold text-gray-400 uppercase">SKU: </span>
                                <span className="text-sm font-semibold text-gray-400">{product.sku}</span>
                            </div>
                            {/* <div className="flex items-center gap-3">
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-green-500"
                                />
                                <div className={`flex items-center gap-2 ${isActive ? 'bg-green-300' : 'bg-red-500'} px-3 py-1 rounded-lg`}>
                                    <span className="text-xs font-medium uppercase">{isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div> */}
                        </div>
                        {/* {product.aggr_product_id && (
                            <div className="mb-2">
                                <span className="text-xs text-gray-400 uppercase">Aggregator Product ID: </span>
                                <span className="text-xs font-medium text-gray-600">{product.aggr_product_id}</span>
                            </div>
                        )} */}
                        <h2 className="text-xl font-bold text-[#C72030] mb-2 uppercase">{product.name}</h2>
                        <div className="text-sm text-gray-600 mb-4">
                            {product.brand && <span>{product.brand}</span>}
                            {product.brand && product.categories && <span className="mx-2">|</span>}
                            {product.categories && <span>{product.categories}</span>}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Product Information</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {product.description || "No description available"}
                            </p>
                        </div>
                    </div>

                    {/* Pricing Structure Card */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 underline">Pricing Structure</h3>
                        <div className="space-y-0">
                            {/* Maximum Retail Price (MRP) */}
                            {/* <div className="border-l-4 border-gray-300 pl-4 py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Base Price</div>
                                        <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(product.base_price || "0").toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">Channel Discount</div>
                                        <div className="text-base font-semibold text-[#C72030]">
                                            {discount > 0 ? `${discount}% OFF` : '0% OFF'}
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            {/* Client Purchase Price */}
                            <div className="border-l-4 border-green-400 bg-green-50 pl-4 py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Price</div>
                                        <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(product.client_price || "0").toLocaleString('en-IN')}</div>
                                        <div className="text-xs text-green-600 mt-1">After channel discount</div>
                                    </div>
                                    {/* <div className="text-right">
                                        <div className="text-xs text-gray-600 mb-1">Client Discount</div>
                                        <div className="text-base font-semibold text-[#C72030]">
                                            {discount > 0 ? `${discount}% OFF` : '0% OFF'}
                                        </div>
                                    </div> */}
                                </div>
                            </div>

                            {/* Final Customer Price */}
                            <div className="border-l-4 border-[#C72030] pl-4 py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Customer Price</div>
                                        <div className="text-2xl font-bold text-[#C72030]">₹ {product.customer_price.toLocaleString('en-IN')}</div>
                                        <div className="text-xs text-[#C72030] mt-1">Best price for end customer</div>
                                    </div>
                                    {/* <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">Customer Discount</div>
                                        <div className="text-base font-semibold text-[#C72030]">
                                            {discount > 0 ? `${discount}% OFF` : '0% OFF'}
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Specifications Card */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 underline">Technical Specifications</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {product.value_type && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Value Type</div>
                                    <div className="text-base font-semibold text-gray-900">{product.value_type}</div>
                                </div>
                            )}
                            {/* {product.min_value && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Min Value</div>
                                    <div className="text-base font-semibold text-gray-900">₹{product.min_value}</div>
                                </div>
                            )}
                            {product.max_value && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Max Value</div>
                                    <div className="text-base font-semibold text-gray-900">₹{product.max_value}</div>
                                </div>
                            )} */}
                            {product.validity && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Validity</div>
                                    <div className="text-base font-semibold text-gray-900">{product.validity}</div>
                                </div>
                            )}
                            {product.usage_type && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Usage Type</div>
                                    <div className="text-base font-semibold text-gray-900">{product.usage_type}</div>
                                </div>
                            )}
                            {product.phone_required !== undefined && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Phone Required</div>
                                    <div className="text-base font-semibold text-gray-900">{product.phone_required ? 'Yes' : 'No'}</div>
                                </div>
                            )}
                            {product.shipping_info && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Shipping Info</div>
                                    <div className="text-base font-semibold text-gray-900">{product.shipping_info}</div>
                                </div>
                            )}
                            {product.origin_country && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Origin Country</div>
                                    <div className="text-base font-semibold text-gray-900">{product.origin_country}</div>
                                </div>
                            )}
                            {product.value_denominations && (
                                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Available Denominations</div>
                                    <div className="text-base font-semibold text-gray-900">{product.value_denominations}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Redemption Instructions & Terms Cards */}
            {(product.redemption_instructions || product.terms_and_conditions) && (
                <div className="grid grid-cols-1 gap-6 mt-6 lg:col-span-2">
                    {product.redemption_instructions && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Redemption Instructions</h3>
                            <div
                                className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100"
                                dangerouslySetInnerHTML={{ __html: product.redemption_instructions }}
                            />
                        </div>
                    )}

                    {product.terms_and_conditions && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Terms & Conditions</h3>
                            <div
                                className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200"
                                dangerouslySetInnerHTML={{ __html: product.terms_and_conditions }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AggregatorInventoryDetails;
