import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
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
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    
    // Add Item Form States
    const [isActive, setIsActive] = useState(true);
    const [category, setCategory] = useState("");
    const [skuCode, setSkuCode] = useState("");
    const [mrp, setMrp] = useState("");
    const [clientPrice, setClientPrice] = useState("");
    const [pointsRequired, setPointsRequired] = useState("");
    const [initialQuantity, setInitialQuantity] = useState("");

    // Mock data for stats
    const stats = {
        totalItems: "1020",
        inStock: "760",
        outOfStock: "240",
    };

    // Mock data for inventory items
    const inventoryData = [
        {
            id: 1,
            category: "Electronics",
            skuItemName: "Wireless Headphones",
            uom: "3.3,000",
            latestPrice: "1.3,000",
            quantity: "50%",
            vendorNames: "AW05",
        },
        {
            id: 2,
            category: "Fashion",
            skuItemName: "Designer Sunglasses",
            uom: "2.5,000",
            latestPrice: "1.4,000",
            quantity: "30%",
            vendorNames: "LUX",
        },
        {
            id: 3,
            category: "Shoes",
            skuItemName: "Running Shoes",
            uom: "2.5,000",
            latestPrice: "1.4,000",
            quantity: "30%",
            vendorNames: "LUX",
        },
    ];

    // Define columns for EnhancedTable
    const columns = [
        { key: "category", label: "Category", sortable: true },
        { key: "skuItemName", label: "SKU/Item Name", sortable: true },
        { key: "uom", label: "UOM", sortable: true },
        { key: "latestPrice", label: "Latest Price", sortable: true },
        { key: "quantity", label: "Quantity", sortable: false },
        { key: "vendorNames", label: "Vendor Name(s)", sortable: false },
    ];

    const renderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "category":
                return <span>{item.category || "-"}</span>;
            case "skuItemName":
                return <span>{item.skuItemName || "-"}</span>;
            case "uom":
                return <span>{item.uom || "-"}</span>;
            case "latestPrice":
                return <span>{item.latestPrice || "-"}</span>;
            case "quantity":
                return <span>{item.quantity || "-"}</span>;
            case "vendorNames":
                return <span>{item.vendorNames || "-"}</span>;
            default:
                return null;
        }
    };

    const handleGlobalSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleExport = () => {
        console.log("Exporting inventory data...");
    };

    const handleAddItem = () => {
        setIsAddItemModalOpen(true);
    };

    const handleSubmitItem = () => {
        console.log("Submitting new item:", {
            isActive,
            category,
            skuCode,
            mrp,
            clientPrice,
            pointsRequired,
            initialQuantity,
        });
        // Add item submission logic here
        setIsAddItemModalOpen(false);
        // Reset form
        setCategory("");
        setSkuCode("");
        setMrp("");
        setClientPrice("");
        setPointsRequired("");
        setInitialQuantity("");
    };

    const renderLeftActions = () => (
        <Button
            onClick={handleAddItem}
            className="bg-[#C72030] hover:bg-[#A01828] text-white"
        >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
        </Button>
    );

    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-[#1A1A1A]">
                        INVENTORY SECTION
                    </h1>
                </div>
            </div>

            {/* Stats Cards - 3 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard
                    title="Total Items"
                    value={stats.totalItems}
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
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
                <StatsCard
                    title="In Stock"
                    value={stats.inStock}
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
                <StatsCard
                    title="Out of Stock"
                    value={stats.outOfStock}
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
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    iconRounded={true}
                    valueColor="text-[#C72030]"
                />
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
                    leftActions={renderLeftActions()}
                    loading={loading}
                    loadingMessage="Loading inventory..."
                    emptyMessage="No inventory items found"
                />
            </div>

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
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Status</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-[#10b981]"
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
                                    <SelectItem value="electronics">Electronics</SelectItem>
                                    <SelectItem value="fashion">Fashion</SelectItem>
                                    <SelectItem value="shoes">Shoes</SelectItem>
                                    <SelectItem value="accessories">Accessories</SelectItem>
                                    <SelectItem value="home">Home & Living</SelectItem>
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
                                className="bg-gray-50 border-[#e5e1d8]"
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
