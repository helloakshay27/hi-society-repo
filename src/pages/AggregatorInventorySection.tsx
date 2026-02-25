import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Eye, RefreshCwIcon } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";

const AggregatorInventorySection = () => {
    const navigate = useNavigate();
    const baseUrl = localStorage.getItem("baseUrl")

    // Tab and category data
    const categories = [
        { value: "gift_card", label: "Gift Card", apiCategory: "voucher_category" },
        { value: "lounge", label: "Lounge", apiCategory: "indian_lounge" },
        { value: "miles", label: "Miles", apiCategory: "mile_category" },
        { value: "merchandise", label: "Merchandise", apiCategory: "merchandise" },
    ];

    const [activeTab, setActiveTab] = useState("gift_card");
    const [expandedDescRows, setExpandedDescRows] = useState<Set<number>>(new Set());
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

    // Define columns for EnhancedTable
    const columns = [
        { key: "action", label: "Action", sortable: false },
        { key: "id", label: "ID", sortable: true },
        { key: "image_url", label: "Image", sortable: false },
        { key: "name", label: "Product Name", sortable: true },
        { key: "sku", label: "SKU / Item Name", sortable: true },
        { key: "added_to_store", label: "Added to Store", sortable: true },
        { key: "aggr_product_id", label: "Aggregator Product ID", sortable: true },
        { key: "description", label: "Description", sortable: false },
        { key: "brand", label: "Brand", sortable: true },
        { key: "price", label: "Price", sortable: true },
        { key: "customer_price", label: "Customer Price", sortable: true },
        { key: "stock_quantity", label: "Stock Quantity", sortable: true },
        { key: "min_stock_level", label: "Min Stock Level", sortable: true },
        { key: "min_value", label: "Min Value", sortable: true },
        { key: "max_value", label: "Max Value", sortable: true },
        { key: "validity", label: "Validity", sortable: false },
        { key: "category", label: "Category", sortable: false },
        { key: "shipping_info", label: "Shipping Info", sortable: false },
        { key: "origin_country", label: "Origin Country", sortable: true },
        { key: "aggregator_id", label: "Aggregator ID", sortable: true },
        { key: "created_at", label: "Created At", sortable: true },
        { key: "updated_at", label: "Updated At", sortable: true },
    ];

    // Fetch inventory data from Runwal API by category
    useEffect(() => {
        fetchInventoryData();
    }, [activeTab, currentPage]);

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            const category = categories.find(c => c.value === activeTab);
            const token = localStorage.getItem("token");
            const url = `https://${baseUrl}/aggregator_products.json?token=${token}&category=${category?.apiCategory}&page=${currentPage}`;

            const response = await axios.get(url);
            const products = response.data?.data || [];

            setInventoryData(products);
            setTotalPages(response.data?.meta?.total_pages || 1);
            setTotalCount(response.data?.meta?.total_count || 0);

            setStats({
                totalProducts: products.length.toString(),
                totalStock: products.reduce((sum, item) => sum + (item.stock_quantity || 0), 0).toString(),
            });
        } catch (error) {
            console.error("Error fetching products data:", error);
            toast.error("Failed to load products data");
            setInventoryData([]);
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
                            title="View Details"
                            onClick={() => navigate(`/loyalty/aggregator-inventory/${item.id}`)}
                        >
                            <Eye className="w-4 h-4 text-gray-700" />
                        </Button>
                    </div>
                );
            case "id":
                return <span className="font-medium">{item.id}</span>;
            case "image_url":
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
            case "added_to_store":
                return <span className="text-sm">{item.added_to_store ? "Yes" : "No"}</span>;
            case "aggr_product_id":
                return <span className="text-sm">{item.aggr_product_id || item.id || "-"}</span>;
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
            case "price":
                return <span className="font-medium">₹{parseFloat(item.price || 0).toFixed(2)}</span>;
            case "customer_price":
                return <span className="font-medium text-green-600">₹{parseFloat(item.customer_price || 0).toFixed(2)}</span>;
            case "stock_quantity":
                return (
                    <span className={item.stock_quantity > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {item.stock_quantity || 0}
                    </span>
                );
            case "min_stock_level":
                return <span className="text-sm">{item.min_stock_level || 0}</span>;
            case "min_value":
                return <span className="text-sm">{item.min_value || "-"}</span>;
            case "max_value":
                return <span className="text-sm">{item.max_value || "-"}</span>;
            case "validity":
                return <span className="text-sm">{item.validity || "-"}</span>;
            case "category":
                return <span className="text-sm">{item.category || "-"}</span>;
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
        console.log("Exporting products data...");
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
            const token = API_CONFIG.TOKEN || "";
            const url = getFullUrl(`/organizations.json?token=${token}`);
            const response = await axios.get(url, { headers: { Authorization: getAuthHeader() } });
            const orgs = response.data?.organizations || [];
            setOrganizations(orgs.map((o: any) => ({ id: o.id, name: o.name })));
        } catch (error) {
            toast.error("Failed to load organizations");
        }
    };

    const getSelectedProductsStatus = () => {
        const selectedProducts = inventoryData.filter(p => selectedProductIds.includes(p.id));
        const addedToStore = selectedProducts.filter(p => p.added_to_store);
        const notAddedToStore = selectedProducts.filter(p => !p.added_to_store);
        return { addedToStore, notAddedToStore };
    };

    const handleAddToStore = async () => {
        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product.");
            return;
        }
        try {
            setLoading(true);
            const token = API_CONFIG.TOKEN || "";
            const url = getFullUrl(`/aggregator_products/add_products_to_store?token=${token}`);
            await axios.post(
                url,
                {
                    product_ids: selectedProductIds
                },
                { headers: { Authorization: getAuthHeader() } }
            );
            toast.success("Products added to store successfully!");
            setSelectedProductIds([]);
            fetchInventoryData();
        } catch (error) {
            toast.error("Failed to add products to store.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromStore = async () => {
        const { addedToStore } = getSelectedProductsStatus();
        if (addedToStore.length === 0) {
            toast.error("Please select at least one product that is already added to store.");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const baseUrl = localStorage.getItem("baseUrl");
            const aggregatorProductIds = addedToStore.map(p => p.id);

            const url = `https://${baseUrl}/aggregator_products/remove_products_from_store?token=${token}`;

            await axios.post(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                data: {
                    aggregator_product_ids: aggregatorProductIds,
                }
            });

            toast.success(`${addedToStore.length} product(s) removed from store!`);
            setSelectedProductIds([]);
            fetchInventoryData();
        } catch (error) {
            console.error("Error removing products from store:", error);
            toast.error("Failed to remove products from store.");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncInventory = async () => {
        try {
            setLoading(true);
            toast.success("Inventory sync started!");
            // Optionally, you can refresh the inventory data after sync
            fetchInventoryData();
        } catch (error) {
            toast.error("Failed to sync inventory.");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage || loading) {
            return;
        }
        setCurrentPage(page);
    };

    const renderPaginationItems = () => {
        if (!totalPages || totalPages <= 0) {
            return null;
        }
        const items = [];
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

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                setCurrentPage(1);
            }} className="w-full">
                <TabsList className="grid w-full grid-cols-4 gap-4 bg-transparent">
                    {categories.map((category) => (
                        <TabsTrigger
                            key={category.value}
                            value={category.value}
                            className="data-[state=active]:bg-[#C72030] data-[state=active]:text-white data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700 border border-gray-300 rounded-md px-4 py-2"
                        >
                            {category.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Tab Content */}
                {categories.map((category) => (
                    <TabsContent key={category.value} value={category.value} className="space-y-4 mt-6">
                        {/* Add to Store / Remove from Store Buttons */}
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={handleAddToStore}
                                className="bg-[#C72030] hover:bg-[#A01828] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || getSelectedProductsStatus().notAddedToStore.length === 0}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add to Store ({getSelectedProductsStatus().notAddedToStore.length})
                            </Button>
                            <Button
                                onClick={handleRemoveFromStore}
                                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || getSelectedProductsStatus().addedToStore.length === 0}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Remove from Store ({getSelectedProductsStatus().addedToStore.length})
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
                                leftActions={
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
                                loadingMessage="Loading products..."
                                emptyMessage="No products found"
                                exportFileName="products"
                                storageKey={`products-table-${activeTab}`}
                            />
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center mt-6 pb-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            className={currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    {renderPaginationItems()}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                            className={currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

export default AggregatorInventorySection;