import React, { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";
// import { getFullUrl, API_CONFIG } from "@/config/apiConfig";

const AggregatorInventorySection = () => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [inventoryData, setInventoryData] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [stats, setStats] = useState({
        totalProducts: "0",
        totalStock: "0",
    });

    // Define columns for EnhancedTable
    const columns = [
        { key: "checkbox", label: "Select" },
        { key: "name", label: "Product Name" },
        { key: "sku", label: "SKU" },
        { key: "brand", label: "Brand" },
        { key: "base_price", label: "Base Price" },
        { key: "sale_price", label: "Sale Price" },
        { key: "stock_quantity", label: "Stock Quantity" },
        { key: "created_at", label: "Created At" },
        // { key: "add_to_cart", label: "Add to Store" },
    ];

    // Fetch inventory data
    useEffect(() => {
        fetchInventoryData();
    }, []);

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            // const url = getFullUrl(`/aggregator_products?token=${API_CONFIG.TOKEN}`);
            const url = "https://runwal-api.lockated.com/aggregator_products?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
            const response = await axios.get(url);
            const products = response.data?.data || [];
            setInventoryData(products);

            // Calculate stats
            const totalProducts = products.length;
            const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock_quantity || 0), 0);

            setStats({
                totalProducts: totalProducts.toString(),
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
            case "checkbox":
                return (
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
                );
            case "name":
                return <span>{item.name || "-"}</span>;
            case "sku":
                return <span>{item.sku || "-"}</span>;
            case "brand":
                return <span>{item.brand || "-"}</span>;
            case "base_price":
                return <span>₹{parseFloat(item.base_price || 0).toFixed(2)}</span>;
            case "sale_price":
                return <span>₹{parseFloat(item.sale_price || 0).toFixed(2)}</span>;
            case "stock_quantity":
                return (
                    <span className={item.stock_quantity > 0 ? "text-green-600" : "text-red-600"}>
                        {item.stock_quantity || 0}
                    </span>
                );
            case "created_at":
                return <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</span>;
            // case "add_to_cart":
            //     return (
            //         <Button
            //             size="sm"
            //             className="bg-[#C72030] hover:bg-[#A01828] text-white"
            //             onClick={() => {
            //                 setSelectedProductId(item.id);
            //                 setSelectedOrgIds([]);
            //                 setIsAddModalOpen(true);
            //             }}
            //         >
            //             Add
            //         </Button>
            //     );
            default:
                return null;
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

    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            
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
            <div className="space-y-4">
                <EnhancedTable
                    data={inventoryData}
                    columns={columns}
                    renderCell={renderCell}
                    enableExport={true}
                    enableGlobalSearch={true}
                    onGlobalSearch={handleGlobalSearch}
                    handleExport={handleExport}
                    loading={loading}
                    loadingMessage="Loading aggregator products..."
                    emptyMessage="No aggregator products found"
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
            </div>
)}

export default AggregatorInventorySection;