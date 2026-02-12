import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Package, Warehouse, Eye, RefreshCwIcon } from "lucide-react";
// import { getFullUrl, API_CONFIG } from "@/config/apiConfig";

const AggregatorInventorySection = () => {
    // Track expanded description rows by item id
    const [expandedDescRows, setExpandedDescRows] = useState<Set<number>>(new Set());
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [inventoryData, setInventoryData] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({
        totalProducts: "0",
        totalStock: "0",
    });

    // Define columns for EnhancedTable - ALL FIELDS
    const columns = [
        { key: "action", label: "Action", sortable: false },
        // { key: "checkbox", label: "Select", sortable: false },
        { key: "id", label: "ID", sortable: true },
        { key: "banner_image_url", label: "Image", sortable: false },
        { key: "name", label: "Product Name", sortable: true },
        { key: "sku", label: "SKU/Item", sortable: true },
        { key: "aggr_product_id", label: "Aggregator Product ID", sortable: true },
        { key: "description", label: "Description", sortable: false },
        { key: "brand", label: "Brand", sortable: true },
        // { key: "base_price", label: "Base Price", sortable: true },
        { key: "client_price", label: "Price", sortable: true },
        { key: "customer_price", label: "Customer Price", sortable: true },
        { key: "stock_quantity", label: "Stock Quantity", sortable: true },
        { key: "min_stock_level", label: "Min Stock Level", sortable: true },
        // { key: "value_type", label: "Value Type", sortable: false },
        { key: "min_value", label: "Min Value", sortable: true },
        { key: "max_value", label: "Max Value", sortable: true },
        // { key: "value_denominations", label: "Denominations", sortable: false },
        { key: "validity", label: "Validity", sortable: false },
        // { key: "usage_type", label: "Usage Type", sortable: false },
        // { key: "phone_required", label: "Phone Required", sortable: true },
        // { key: "redemption_fee", label: "Redemption Fee", sortable: true },
        // { key: "redemption_fee_type", label: "Fee Type", sortable: false },
        // { key: "redemption_fee_borne_by_user", label: "Fee by User", sortable: true },
        // { key: "published", label: "Published", sortable: true },
        // { key: "featured", label: "Featured", sortable: true },
        // { key: "is_recommended", label: "Recommended", sortable: true },
        { key: "categories", label: "Category", sortable: false },
        // { key: "filter_group_code", label: "Filter Group", sortable: false },
        { key: "shipping_info", label: "Shipping Info", sortable: false },
        { key: "origin_country", label: "Origin Country", sortable: true },
        { key: "aggregator_id", label: "Aggregator ID", sortable: true },
        { key: "created_at", label: "Created At", sortable: true },
        { key: "updated_at", label: "Updated At", sortable: true },
    ];

    // Fetch inventory data
    useEffect(() => {
        fetchInventoryData();
    }, [currentPage]);

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            // const url = getFullUrl(`/aggregator_products?token=${API_CONFIG.TOKEN}&page=${currentPage}`);
            const url = `https://runwal-api.lockated.com/aggregator_products?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ&page=${currentPage}`;
            const response = await axios.get(url);
            const products = response.data?.data || [];
            const meta = response.data?.meta || {};

            setInventoryData(products);
            setCurrentPage(meta.page || 1);
            setTotalPages(meta.total_pages || 1);
            setTotalCount(meta.total_count || 0);

            // Calculate stats from meta
            const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock_quantity || 0), 0);

            setStats({
                totalProducts: (meta.total_count || 0).toString(),
                totalStock: totalStock.toString(),
            });
        } catch (error) {
            console.error("Error fetching aggregator products data:", error);
            toast.error("Failed to load aggregator products data");
        } finally {
            setLoading(false);
        }
    };

    const renderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "action":
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectedProductIds.includes(item.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedProductIds([...selectedProductIds, item.id]);
                                } else {
                                    setSelectedProductIds(selectedProductIds.filter(id => id !== item.id));
                                }
                            }}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/loyalty/aggregator-inventory/${item.id}`)}
                            title="View Details"
                        >
                            <Eye className="w-4 h-4 text-gray-700" />
                        </Button>
                    </div>
                );
            case "id":
                return <span className="font-medium">{item.id}</span>;
            case "banner_image_url":
                return item.banner_image_url ? (
                    <img
                        src={item.banner_image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                        }}
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                        No Image
                    </div>
                );
            case "name":
                return <span className="font-medium">{item.name || "-"}</span>;
            case "sku":
                return <span className="text-sm">{item.sku || "-"}</span>;
            case "aggr_product_id":
                return <span className="text-sm">{item.aggr_product_id || "-"}</span>;
            case "description": {
                const desc = item.description || "-";
                const isExpanded = expandedDescRows.has(item.id);
                return (
                    <div
                        className={`max-w-xs text-sm ${isExpanded ? "whitespace-pre-line break-words" : "truncate"}`}
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
            }
            case "brand":
                return <span>{item?.brand || "-"}</span>;
            case "base_price":
                return <span className="font-medium">₹{parseFloat(item.base_price || 0).toFixed(2)}</span>;
            case "customer_price":
                return <span className="font-medium text-green-600">₹{parseFloat(item.customer_price || 0).toFixed(2)}</span>;
            case "client_price":
                return <span>₹{item.client_price || 0}</span>;
            case "stock_quantity":
                return (
                    <span className={item.stock_quantity > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {item.stock_quantity || 0}
                    </span>
                );
            case "min_stock_level":
                return <span className="text-sm">{item.min_stock_level || 0}</span>;
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
                    <span className={`text-xs px-2 py-1 rounded ${item.phone_required ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.phone_required ? "Yes" : "No"}
                    </span>
                );
            case "redemption_fee":
                return <span className="text-sm">₹{parseFloat(item.redemption_fee || 0).toFixed(2)}</span>;
            case "redemption_fee_type":
                return <span className="text-sm">{item.redemption_fee_type || "-"}</span>;
            case "redemption_fee_borne_by_user":
                return (
                    <span className={`text-xs px-2 py-1 rounded ${item.redemption_fee_borne_by_user ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.redemption_fee_borne_by_user ? "Yes" : "No"}
                    </span>
                );
            case "published":
                return (
                    <span className={`text-xs px-2 py-1 rounded ${item.published ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.published ? "Yes" : "No"}
                    </span>
                );
            case "featured":
                return (
                    <span className={`text-xs px-2 py-1 rounded ${item.featured ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.featured ? "Yes" : "No"}
                    </span>
                );
            case "is_recommended":
                return (
                    <span className={`text-xs px-2 py-1 rounded ${item.is_recommended ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.is_recommended ? "Yes" : "No"}
                    </span>
                );
            case "categories":
                return <span className="text-sm">{item.categories || "-"}</span>;
            case "filter_group_code":
                return <span className="text-sm">{item.filter_group_code || "-"}</span>;
            case "shipping_info":
                return <span className="text-sm">{item.shipping_info || "-"}</span>;
            case "origin_country":
                return <span className="text-sm">{item.origin_country || "-"}</span>;
            case "aggregator_id":
                return <span className="text-sm">{item.aggregator_id || "-"}</span>;
            case "created_at":
                return <span className="text-sm">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</span>;
            case "updated_at":
                return <span className="text-sm">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "-"}</span>;
            default:
                return <span className="text-sm">-</span>;
        }
    };

    const handleGlobalSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleExport = () => {
        console.log("Exporting aggregator products data...");
    };

    // Add Panel Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
    const [selectedOrgIds, setSelectedOrgIds] = useState<number[]>([]);

    // Fetch organizations and products for modal
    useEffect(() => {
        if (isAddModalOpen) {
            fetchOrganizations();
        }
    }, [isAddModalOpen]);

    const fetchOrganizations = async () => {
        try {
            // const url = getFullUrl(`/organizations.json?token=${API_CONFIG.TOKEN}`);
            const url = "https://runwal-api.lockated.com/organizations.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
            const response = await axios.get(url);
            const orgs = response.data?.organizations || [];
            setOrganizations(orgs.map((o: any) => ({ id: o.id, name: o.name })));
        } catch (error) {
            toast.error("Failed to load organizations");
        }
    };

    const handleAddToStore = async () => {
        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product.");
            return;
        }
        try {
            setLoading(true);
            // const url = getFullUrl(`/aggregator_products/add_products_to_store?token=${API_CONFIG.TOKEN}`);
            const url = "https://runwal-api.lockated.com/aggregator_products/add_products_to_store?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
            await axios.post(
                url,
                {
                    product_ids: selectedProductIds
                }
            );
            toast.success("Products added to store successfully!");
            setSelectedProductIds([]);
            fetchInventoryData();
        } catch (error) {
            toast.error("Failed to add products to store.");
        } finally {
            setLoading(false);
        }

        // Previous implementation with organization selection
        // if (selectedOrgIds.length === 0) {
        //     toast.error("Please select at least one organization.");
        //     return;
        // }
        // const url = getFullUrl(`/aggregator_products/add_to_store?token=${API_CONFIG.TOKEN}`);
        // await axios.post(
        //     url,
        //     { 
        //         product_ids: selectedProductIds,
        //         organization_ids: selectedOrgIds 
        //     }
        // );
        // setIsAddModalOpen(false);
        // setSelectedOrgIds([]);
    };

    const handleSyncInventory = async () => {
        try {
            setLoading(true);
            await axios.get(
                "https://runwal-api.lockated.com/aggregators/1/sync_products?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ"
            );
            toast.success("Inventory sync started!");
            // Optionally, you can refresh the inventory data after sync
            fetchInventoryData();
        } catch (error) {
            toast.error("Failed to sync inventory.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            <Toaster position="top-right" richColors closeButton />

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">Aggregator Inventory</h1>
                <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages} | Total: {totalCount} products
                </div>
            </div>

            {/* Stats Cards */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <StatsCard
                    icon={<Package />}
                    label="Total Products"
                    value={stats.totalProducts}
                    bgColor="bg-[#F6F4EE]"
                    iconBg="bg-[#C4B89D54]"
                />
                <StatsCard
                    icon={<Warehouse />}
                    label="Total Stock"
                    value={stats.totalStock}
                    bgColor="bg-[#F6F4EE]"
                    iconBg="bg-[#C4B89D54]"
                />
            </div> */}

            {/* Add to Store Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleAddToStore}
                    className="bg-[#C72030] hover:bg-[#A01828] text-white"
                    disabled={selectedProductIds.length === 0 || loading}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Store ({selectedProductIds.length})
                </Button>
            </div>

            {/* Inventory Table */}
            <div className="space-y-4 mui-scrollbar-x">
                <EnhancedTable
                    data={inventoryData}
                    columns={columns}
                    renderCell={renderCell}
                    enableExport={false}
                    enableGlobalSearch={true}
                    // onGlobalSearch={handleGlobalSearch}
                    leftActions={
                        // Sync Inventory Button
                        <div className="mb-2">
                            <Button
                                onClick={handleSyncInventory}
                                className="bg-[#F6F4EE] text-[#C72030] border border-[#E5E1D8] rounded-none px-6 py-2 font-medium text-base hover:bg-[#f3e9e9]"
                                disabled={loading}
                            >
                                <RefreshCwIcon className="mr-2 h-4 w-4" />
                                Sync Inventory
                            </Button>
                        </div>
                    }
                    handleExport={handleExport}
                    loading={loading}
                    loadingMessage="Loading aggregator products..."
                    emptyMessage="No aggregator products found"
                    pagination={true}
                    exportFileName="aggregator-products"
                    storageKey="aggregator-products-table"
                />
            </div>
            {/* <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-[#1A1A1A]">
                            Add Products to Store
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 mt-1">
                            Select one or more organizations to add {selectedProductIds.length} selected product(s) to their store.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4 pb-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#1A1A1A]">
                                Organizations <span className="text-red-500">*</span>
                            </Label>
                            <div className="bg-gray-50 border border-[#e5e1d8] rounded px-2 py-1 max-h-40 overflow-y-auto">
                                {organizations.length === 0 ? (
                                    <div className="px-3 py-2 text-gray-400">No organizations found</div>
                                ) : (
                                    organizations.map((org) => (
                                        <label key={org.id} className="flex items-center gap-2 py-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrgIds.includes(org.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedOrgIds([...selectedOrgIds, org.id]);
                                                    } else {
                                                        setSelectedOrgIds(selectedOrgIds.filter(id => id !== org.id));
                                                    }
                                                }}
                                            />
                                            <span>{org.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={handleAddToStore}
                                className="bg-[#C72030] hover:bg-[#A01828] text-white px-12"
                                disabled={loading}
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog> */}
        </div >
    )
}

export default AggregatorInventorySection;