import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Eye, Edit, Trash2, Package, CheckCircle, AlertCircle, Upload, Download } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_CONFIG, getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const LoyaltyInventorySection = () => {
    const navigate = useNavigate();
    // const baseURL = API_CONFIG.BASE_URL;
    const [loading, setLoading] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [inventoryData, setInventoryData] = useState([]);
    // Track expanded description rows by item id
    const [expandedDescRows, setExpandedDescRows] = useState<Set<number>>(new Set());
    const [stats, setStats] = useState({
        totalItems: "0",
        inStock: "0",
        outOfStock: "0",
    });

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedDiscount, setSelectedDiscount] = useState<string>("");
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Add Item Form States
    const [isActive, setIsActive] = useState(true);
    const [category, setCategory] = useState("");
    const [skuCode, setSkuCode] = useState("");
    const [mrp, setMrp] = useState("");
    const [clientPrice, setClientPrice] = useState("");
    const [pointsRequired, setPointsRequired] = useState("");
    const [initialQuantity, setInitialQuantity] = useState("");

    // Categories fetched from API
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    // Define columns for EnhancedTable - All API fields
    const columns = [
        { key: "actions", label: "Actions", sortable: false },
        { key: "image", label: "Image", sortable: false },
        { key: "status", label: "Status", sortable: true },
        { key: "name", label: "Item Name", sortable: true },
        // { key: "id", label: "ID", sortable: true },
        { key: "sku", label: "SKU/Item", sortable: true },
        { key: "aggregator_product_id", label: "Aggregator Product ID", sortable: true },
        { key: "description", label: "Description", sortable: true },
        { key: "brand", label: "Brand", sortable: true },
        // { key: "base_price", label: "Base Price", sortable: true },
        { key: "client_price", label: "Price", sortable: true },
        { key: "customer_price", label: "Customer Price", sortable: true },
        // { key: "discount", label: "Discount", sortable: true },
        // { key: "value_type", label: "Value Type", sortable: true },
        { key: "min_value", label: "Min Value", sortable: true },
        { key: "max_value", label: "Max Value", sortable: true },
        // { key: "value_denominations", label: "Value Denominations", sortable: true },
        { key: "validity", label: "Validity", sortable: true },
        // { key: "usage_type", label: "Usage Type", sortable: true },
        // { key: "phone_required", label: "Phone Required", sortable: true },
        // { key: "redemption_fee", label: "Redemption Fee", sortable: true },
        // { key: "redemption_fee_type", label: "Redemption Fee Type", sortable: true },
        // { key: "redemption_fee_borne_by_user", label: "Fee Borne By User", sortable: true },
        { key: "terms_and_conditions", label: "Terms & Conditions", sortable: true },
        { key: "redemption_instructions", label: "Redemption Instructions", sortable: true },
        { key: "stock_quantity", label: "Stock Quantity", sortable: true },
        { key: "min_stock_level", label: "Min Stock Level", sortable: true },
        // { key: "published", label: "Published", sortable: true },
        // { key: "featured", label: "Featured", sortable: true },
        // { key: "is_trending", label: "Is Trending", sortable: true },
        // { key: "is_bestseller", label: "Is Bestseller", sortable: true },
        // { key: "is_new_arrival", label: "Is New Arrival", sortable: true },
        // { key: "is_recommended", label: "Is Recommended", sortable: true },
        { key: "generic_category_id", label: "Category ID", sortable: true },
        { key: "categories", label: "Category", sortable: true },
        // { key: "filter_group_code", label: "Filter Group Code", sortable: true },
        { key: "origin_country", label: "Origin Country", sortable: true },
        { key: "shipping_info", label: "Shipping Info", sortable: true },
        { key: "banner_image", label: "Banner Image", sortable: false },
        { key: "created_at", label: "Created At", sortable: true },
        { key: "updated_at", label: "Updated At", sortable: true },
    ];

    // Fetch inventory and categories data
    useEffect(() => {
        fetchInventoryData();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            // const url = getFullUrl("/generic_categories?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ");
            const url = "https://runwal-api.lockated.com/generic_categories?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
            const response = await axios.get(url);
            const cats = response.data?.categories || [];
            setCategories(cats.map((cat: any) => ({ id: cat.id, name: cat.name })));
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to load categories");
        }
    };

    const handleToggleActive = async (nextActive: boolean) => {
        if (selectedProductIds.length === 0 || isUpdatingStatus) {
            return;
        }

        try {
            setIsUpdatingStatus(true);

            // Update all selected products
            const updatePromises = selectedProductIds.map(async (id) => {
                const url = `https://runwal-api.lockated.com/products/${id}.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
                return axios.put(url, {
                    product: {
                        status: nextActive ? "active" : "inactive",
                        published: nextActive,
                    },
                });
            });

            await Promise.all(updatePromises);

            // Update local state
            setInventoryData((prevData: any[]) =>
                prevData.map((item) =>
                    selectedProductIds.includes(item.id)
                        ? { ...item, status: nextActive ? "active" : "inactive", published: nextActive }
                        : item
                )
            );

            toast.success(`${selectedProductIds.length} product(s) marked ${nextActive ? "active" : "inactive"}.`);
            setIsSelectionModalOpen(false);
            setSelectedProductIds([]);
        } catch (error) {
            console.error("Error updating product status:", error);
            toast.error("Failed to update product status");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            // const url = getFullUrl("/products?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ");
            const url = "https://runwal-api.lockated.com/products?source=admin_portal&token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
            const response = await axios.get(url);
            const products = response.data?.products || [];
            setInventoryData(products);

            // Calculate stats
            const totalItems = products.length;
            const inStock = products.filter((p) => p.stock_quantity > 0).length;
            const outOfStock = products.filter((p) => p.stock_quantity === 0).length;

            setStats({
                totalItems: totalItems.toString(),
                inStock: inStock.toString(),
                outOfStock: outOfStock.toString(),
            });
        } catch (error) {
            console.error("Error fetching inventory data:", error);
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    const renderCell = (item: any, columnKey: string) => {
        const statusColors = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-red-100 text-red-800",
        };
        switch (columnKey) {
            case "actions":
                return (
                    <div className="flex gap-2 items-center">
                        <input
                            type="checkbox"
                            checked={selectedProductIds.includes(item.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    const newSelection = [...selectedProductIds, item.id];
                                    setSelectedProductIds(newSelection);
                                    setIsSelectionModalOpen(true);
                                } else {
                                    const newSelection = selectedProductIds.filter(id => id !== item.id);
                                    setSelectedProductIds(newSelection);
                                    if (newSelection.length === 0) {
                                        setIsSelectionModalOpen(false);
                                    }
                                }
                            }}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/loyalty/inventory-details/${item.id}`);
                            }}
                            className="text-gray-600 hover:text-[#C72030]"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                );
            case "image":
                return item.banner_image ? (
                    <img
                        src={item.banner_image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                        }}
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center !justify-center text-xs text-gray-400">
                        No Image
                    </div>
                );
            case "status":
                const published = item.published === true;
                return (
                    <div className={`flex items-center justify-center w-24 px-2 py-1 rounded-md text-xs font-medium ${published ? statusColors.active : statusColors.inactive}`}>
                        <p className="mx-auto">{published ? "True" : "False"}</p>
                    </div>
                );
            case "id":
                return <span className="text-sm">{item.id || "-"}</span>;
            case "sku":
                return <span className="text-sm font-medium">{item.sku || "-"}</span>;
            case "aggregator_product_id":
                return <span className="text-sm">{item.aggregator_product_id || "-"}</span>;
            case "name":
                return <span className="text-sm">{item.name || "-"}</span>;
            case "description":
                const desc = item.description || "-";
                const isExpanded = expandedDescRows.has(item.id);
                return (
                    <div
                        className={`text-sm ${isExpanded ? "whitespace-pre-line break-words" : "truncate"}`}
                        style={{
                            maxWidth: 300,
                            width: 300,
                            cursor: desc !== "-" ? "pointer" : "default",
                            wordBreak: isExpanded ? "break-word" : "normal",
                        }}
                        title={desc}
                        onClick={() => {
                            if (desc !== "-") {
                                setExpandedDescRows(prev => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) {
                                        next.delete(item.id);
                                    } else {
                                        next.add(item.id);
                                    }
                                    return next;
                                });
                            }
                        }}
                    >
                        {desc}
                    </div>
                );
            case "brand":
                return <span className="text-sm">{item.brand || "-"}</span>;
            case "base_price":
                return <span className="text-sm">₹{parseFloat(item.base_price || 0).toFixed(2)}</span>;
            case "client_price":
                return <span className="text-sm">₹{parseFloat(item.client_price || 0).toFixed(2)}</span>;
            case "customer_price":
                return <span className="text-sm">₹{parseFloat(item.customer_price || 0).toFixed(2)}</span>;
            case "sale_price":
                return <span className="text-sm">₹{parseFloat(item.sale_price || 0).toFixed(2)}</span>;
            case "final_price":
                return <span className="text-sm font-medium">₹{parseFloat(item.final_price || 0).toFixed(2)}</span>;
            case "discount":
                return <span className="text-sm">{item.discount || "-"}</span>;
            case "value_type":
                return <span className="text-sm">{item.value_type || "-"}</span>;
            case "min_value":
                return <span className="text-sm">{item.min_value || "-"}</span>;
            case "max_value":
                return <span className="text-sm">{item.max_value || "-"}</span>;
            case "value_denominations":
                return <span className="text-sm">{item.value_denominations || "-"}</span>;
            case "validity":
                return <span className="text-sm">{item.validity || "-"}</span>;
            case "usage_type":
                return <span className="text-sm">{item.usage_type || "-"}</span>;
            case "phone_required":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.phone_required ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.phone_required ? "Yes" : "No"}
                    </span>
                );
            case "redemption_fee":
                return <span className="text-sm">₹{parseFloat(item.redemption_fee || 0).toFixed(2)}</span>;
            case "redemption_fee_type":
                return <span className="text-sm">{item.redemption_fee_type || "-"}</span>;
            case "redemption_fee_borne_by_user":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.redemption_fee_borne_by_user ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.redemption_fee_borne_by_user ? "Yes" : "No"}
                    </span>
                );
            case "terms_and_conditions":
                return <div className="text-sm truncate max-w-xs" title={item.terms_and_conditions}>{item.terms_and_conditions || "-"}</div>;
            case "redemption_instructions":
                return <div className="text-sm truncate max-w-xs" title={item.redemption_instructions}>{item.redemption_instructions || "-"}</div>;
            case "stock_quantity":
                return <span className="text-sm font-medium">{item.stock_quantity || 0}</span>;
            case "min_stock_level":
                return <span className="text-sm">{item.min_stock_level || 0}</span>;
            case "status":
                const statusColorsMap = {
                    active: "bg-green-100 text-green-800",
                    pending: "bg-yellow-100 text-yellow-800",
                    inactive: "bg-red-100 text-red-800",
                };
                const status = item.status || "inactive";
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status.toLowerCase()] || statusColors.active}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                );
            case "published":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.published ? "Published" : "Draft"}
                    </span>
                );
            case "featured":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.featured ? "Yes" : "No"}
                    </span>
                );
            case "is_trending":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_trending ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_trending ? "Yes" : "No"}
                    </span>
                );
            case "is_bestseller":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_bestseller ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_bestseller ? "Yes" : "No"}
                    </span>
                );
            case "is_new_arrival":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_new_arrival ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_new_arrival ? "Yes" : "No"}
                    </span>
                );
            case "is_recommended":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_recommended ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_recommended ? "Yes" : "No"}
                    </span>
                );
            case "generic_category_id":
                return <span className="text-sm">{item.generic_category_id || "-"}</span>;
            case "categories":
                return <span className="text-sm">{item.categories || "-"}</span>;
            case "filter_group_code":
                return <span className="text-sm">{item.filter_group_code || "-"}</span>;
            case "origin_country":
                return <span className="text-sm">{item.origin_country || "-"}</span>;
            case "shipping_info":
                return <span className="text-sm truncate max-w-xs" title={item.shipping_info}>{item.shipping_info || "-"}</span>;
            case "banner_image":
                return item.banner_image?.url ? (
                    <img src={item.banner_image.url} alt="Banner" className="w-12 h-12 object-cover rounded" />
                ) : (
                    <span className="text-sm text-gray-400">No image</span>
                );
            case "created_at":
                return <span className="text-sm">{new Date(item.created_at).toLocaleDateString()}</span>;
            case "updated_at":
                return <span className="text-sm">{new Date(item.updated_at).toLocaleDateString()}</span>;
            default:
                return null;
        }
    };

    const handleExport = () => {
        console.log("Exporting inventory data...");
    };

    const handleAddItem = () => {
        setIsAddItemModalOpen(true);
    };

    const handleSubmitItem = async () => {
        // Validate required fields
        if (!category || !skuCode || !mrp || !clientPrice || !pointsRequired) {
            toast.error("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("product[name]", skuCode); // Using SKU as name for demo
            formData.append("product[description]", ""); // No description field in form
            formData.append("product[sku]", skuCode);
            formData.append("product[base_price]", mrp);
            formData.append("product[sale_price]", clientPrice);
            formData.append("product[stock_quantity]", initialQuantity || "0");
            formData.append("product[brand]", ""); // No brand field in form
            formData.append("product[is_trending]", "false");
            formData.append("product[is_bestseller]", "false");
            formData.append("product[is_new_arrival]", "false");
            formData.append("product[category_ids][]", category ? category.toString() : "");
            // formData.append("product[images][]", file) // Not implemented

            // Add points as a custom field if your backend supports it
            formData.append("product[points_required]", pointsRequired);

            // API expects token as query param
            // const url = getFullUrl("/products?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ");
            const url = "https://runwal-api.lockated.com/products?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
            await axios.post(
                url,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast.success("Item added successfully!");
            setIsAddItemModalOpen(false);
            // Reset form
            setCategory("");
            setSkuCode("");
            setMrp("");
            setClientPrice("");
            setPointsRequired("");
            setInitialQuantity("");
            // Refresh inventory
            fetchInventoryData();
        } catch (error) {
            console.error("Error adding item:", error);
            toast.error("Failed to add item.");
        } finally {
            setLoading(false);
        }
    };

    const renderLeftActions = () => (
        <div className="flex items-center gap-3">
            <Button
                onClick={handleAddItem}
                className="bg-[#C72030] hover:bg-[#A01828] text-white"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
            </Button>

            {/* <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px] bg-white border-gray-300">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedDiscount} onValueChange={setSelectedDiscount}>
                <SelectTrigger className="w-[140px] bg-white border-gray-300">
                    <SelectValue placeholder="Discount" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Discounts</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                </SelectContent>
            </Select> */}
        </div >
    );

    return (
        <div className="p-6 space-y-6 bg-[#FAFAFA] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-[#1A1A1A]">
                        Redemption Store
                    </h1>
                </div>
            </div>

            {/* Stats Cards - 3 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FEE2E2] rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#C72030]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[#1A1A1A]">{stats.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#D1FAE5] rounded flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-[#059669]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[#1A1A1A]">{stats.inStock}</div>
                        <div className="text-sm text-gray-600">In Stock</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FEF3C7] rounded flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[#1A1A1A]">{stats.outOfStock}</div>
                        <div className="text-sm text-gray-600">Out of Stock</div>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="space-y-4">
                <EnhancedTable
                    data={inventoryData}
                    columns={columns}
                    renderCell={renderCell}
                    enableExport={false}
                    handleExport={handleExport}
                    leftActions={renderLeftActions()}
                    loading={loading}
                    loadingMessage="Loading inventory..."
                    emptyMessage="No inventory items found"
                    storageKey="loyalty-inventory-table"
                />
            </div>

            {/* Selection Floating Bar */}
            {isSelectionModalOpen && selectedProductIds.length > 0 && (
                <div className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)] flex items-center overflow-hidden min-w-[600px] min-h-[100px]">
                    {/* Left accent border */}
                    <div className="w-10 self-stretch bg-[#C4B089] shrink-0 flex items-center justify-center" >
                        <span className="text-sm font-bold text-[#C72030]">{selectedProductIds.length}</span>
                    </div>

                    {/* Count badge */}
                    <div className="flex items-center gap-3 px-4 py-3 flex-1">
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-[#1A1A1A]">Selection</h3>
                            <p className="text-sm text-gray-500 truncate">
                                {(() => {
                                    const selectedItem = (inventoryData as any[]).find(
                                        (item) => item.id === selectedProductIds[0]
                                    );
                                    return selectedItem
                                        ? `${selectedItem.categories || ""} | ${selectedItem.name || ""}`
                                        : "";
                                })()}
                                {selectedProductIds.length > 1 && ` +${selectedProductIds.length - 1} more`}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 px-2">
                        <button
                            onClick={() => handleToggleActive(true)}
                            disabled={isUpdatingStatus}
                            className="flex flex-col items-center gap-1 px-5 py-2 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-5 h-5 text-gray-900" strokeWidth={3} />
                            <span className="text-sm mt-2 font-medium text-gray-900">Activate</span>
                        </button>
                        <button
                            onClick={() => handleToggleActive(false)}
                            disabled={isUpdatingStatus}
                            className="flex flex-col items-center gap-1 px-5 py-2 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                                <path d="M8.15309 3.15385C6.19156 1.19231 3.07617 0.576923 0.345403 1.42308C0.230018 1.42308 0.0761719 1.61538 0.0761719 1.92308C0.0761719 2.23077 0.0761719 3.07692 0.0761719 3.42308C0.0761719 3.73077 0.345403 3.80769 0.499249 3.76923C2.57617 2.92308 5.11463 3.30769 6.76848 5.03846L7.19156 5.46154C7.42233 5.69231 7.23002 6.11539 6.92233 6.11539H3.92233C3.61463 6.11539 3.3454 6.34615 3.3454 6.69231V7.84615C3.3454 8.15385 3.57617 8.42308 3.92233 8.42308L11.3069 8.5C11.6146 8.5 11.8839 8.26923 11.8839 7.92308L11.9223 0.576923C11.9223 0.269231 11.6916 0 11.3454 0H10.1916C9.88386 0 9.57617 0.230769 9.57617 0.538462L9.53771 3.57692C9.53771 3.88462 9.11463 4.07692 8.88386 3.84615C8.92233 3.88462 8.15309 3.15385 8.15309 3.15385Z" fill="black" />
                                <path d="M0.576923 9.92311H1.73077C2.03846 9.92311 2.30769 10.1923 2.30769 10.5V15.577C2.30769 15.8847 2.57692 16.1539 2.88462 16.1539H15.5769C15.8846 16.1539 16.1538 15.8847 16.1538 15.577V5.73081C16.1538 5.42311 15.8846 5.15388 15.5769 5.15388H14.0385C13.7308 5.15388 13.4615 4.88465 13.4615 4.57696V3.42311C13.4615 3.11542 13.7308 2.84619 14.0385 2.84619H16.9231C17.7692 2.84619 18.4615 3.5385 18.4615 4.38465V16.9231C18.4615 17.7693 17.7692 18.4616 16.9231 18.4616H1.53846C0.692308 18.4616 0 17.7693 0 16.9231V10.5C0 10.1923 0.269231 9.92311 0.576923 9.92311Z" fill="black" />
                            </svg>
                            <span className="text-sm mt-2 font-medium text-gray-900">Deactivate</span>
                        </button>
                    </div>

                    {/* Divider + Close */}
                    <div className="h-10 w-px bg-gray-200 mx-1" />
                    <button
                        onClick={() => {
                            setIsSelectionModalOpen(false);
                            setSelectedProductIds([]);
                        }}
                        className="p-3 hover:bg-gray-50 rounded transition-colors mr-2"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
            )}

            {/* Add Item Modal */}
            <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-xl font-semibold text-[#1A1A1A]">
                                    Add New Item
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500 mt-1">
                                    Add a new SKU to the catalog with pricing and points configuration
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 mt-4 pb-4">
                        {/* Status Toggle */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-[#1A1A1A]">Status</Label>
                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-xs font-medium px-3 py-1 rounded-md ${isActive
                                        ? "bg-[#D1FAE5] text-[#065F46]"
                                        : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="h-6 w-11 data-[state=checked]:!bg-[#10b981] data-[state=unchecked]:!bg-gray-300 [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#1A1A1A]">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-gray-50 border-[#e5e1d8]">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.length === 0 ? (
                                        <div className="px-3 py-2 text-gray-400">No categories found</div>
                                    ) : (
                                        categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* SKU Code */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#1A1A1A]">
                                SKU Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={skuCode}
                                onChange={(e) => setSkuCode(e.target.value)}
                                className="bg-gray-50 border-[#e5e1d8] p-4 h-16 text-lg" // Increased height and font size
                                placeholder="e.g., ELEC-PH-IP15-001"
                            />
                        </div>

                        {/* Pricing Details */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
                                Pricing Details
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-[#1A1A1A]">
                                        MRP <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={mrp}
                                        onChange={(e) => setMrp(e.target.value)}
                                        className="bg-gray-50 border-[#e5e1d8]"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-[#1A1A1A]">
                                        Client Price <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={clientPrice}
                                        onChange={(e) => setClientPrice(e.target.value)}
                                        className="bg-gray-50 border-[#e5e1d8]"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Points Required */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#1A1A1A]">
                                Points Required <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                value={pointsRequired}
                                onChange={(e) => setPointsRequired(e.target.value)}
                                className="bg-gray-50 border-[#e5e1d8]"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500">
                                Number of loyalty points needed for redemption
                            </p>
                        </div>

                        {/* Initial Quantity */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#1A1A1A]">
                                Initial Quantity
                            </Label>
                            <Input
                                type="number"
                                value={initialQuantity}
                                onChange={(e) => setInitialQuantity(e.target.value)}
                                className="bg-gray-50 border-[#e5e1d8]"
                                placeholder="0"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={handleSubmitItem}
                                className="bg-[#C72030] hover:bg-[#A01828] text-white px-12"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LoyaltyInventorySection;
