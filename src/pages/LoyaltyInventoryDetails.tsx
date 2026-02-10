import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { toast } from "sonner";
import { StatsCard } from "@/components/StatsCard";

export const LoyaltyInventoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const url = `https://runwal-api.lockated.com/products/${id}?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
      const response = await axios.get(url);
      const product = response.data?.product || null;
      setItem(product);
      if (product) {
        setIsActive(product.status === 'active' || product.published);
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
        <div className="text-gray-500">Loading product details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#C72030] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-gray-500">Product not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-[#C72030] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Inventory</span>
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Current Stock"
          value={item.stock_quantity || 0}
          icon={<Package className="w-6 h-6 text-[#C72030]" />}
          iconRounded={true}
          valueColor="text-[#1A1A1A]"
        />
        <StatsCard
          title="Total Sold"
          value={0}
          icon={<ShoppingCart className="w-6 h-6 text-[#C72030]" />}
          iconRounded={true}
          valueColor="text-[#1A1A1A]"
        />
        <StatsCard
          title="Last Order Restocked"
          value={new Date(item.updated_at).toLocaleDateString()}
          icon={<Calendar className="w-6 h-6 text-[#C72030]" />}
          iconRounded={true}
          valueColor="text-[#1A1A1A]"
        />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Images */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center">
            {item.banner_image?.url ? (
              <img src={item.banner_image.url} alt={item.name} className="w-full h-96 object-contain" />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
          </div>
          {item.images && item.images.length > 0 && (
            <div className="flex gap-3">
              {item.images.slice(0, 3).map((img: any, idx: number) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center w-28 h-28">
                  <img src={img.url || img} alt={`Product ${idx + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="flex flex-col gap-6">
          {/* Product Name & Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs text-gray-400 uppercase">SKU: </span>
                <span className="text-sm font-semibold text-gray-700">{item.sku || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${isActive ? 'bg-green-500' : 'bg-red-500'} text-white px-3 py-1 rounded-full`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-xs font-medium uppercase">{isActive ? "Active" : "Inactive"}</span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#C72030] mb-2 uppercase">{item.name || "Unnamed Product"}</h2>
            <div className="text-sm text-gray-600 mb-4">
              {item.brand && <span>{item.brand}</span>}
              {item.brand && item.generic_category_id && <span className="mx-2">|</span>}
              {item.generic_category_id && <span>Category {item.generic_category_id}</span>}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Product Information</h3>
              {item.description ? (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {item.description}
                </p>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">
                  No product description available.
                </p>
              )}
            </div>
          </div>

          {/* Pricing Structure Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 underline">Pricing Structure</h3>
            <div className="space-y-0">
              {/* Maximum Retail Price (MRP) */}
              <div className="border-l-4 border-gray-300 pl-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Maximum Retail Price (MRP)</div>
                    <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(item.base_price || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Channel Discount</div>
                    <div className="text-base font-semibold text-[#C72030]">
                      {item.discount || (
                        item.base_price && item.sale_price
                          ? Math.round(((parseFloat(item.base_price) - parseFloat(item.sale_price)) / parseFloat(item.base_price)) * 100) + '% OFF'
                          : '0% OFF'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Purchase Price */}
              <div className="border-l-4 border-green-400 bg-green-50 pl-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Client Purchase Price</div>
                    <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(item.sale_price || 0).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-green-600 mt-1">After channel discount</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 mb-1">Client Discount</div>
                    <div className="text-base font-semibold text-[#C72030]">
                      {item.discount || (
                        item.sale_price && item.final_price
                          ? Math.round(((parseFloat(item.sale_price) - parseFloat(item.final_price)) / parseFloat(item.sale_price)) * 100) + '% OFF'
                          : '0% OFF'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Customer Price */}
              <div className="border-l-4 border-[#C72030] pl-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Final Customer Price</div>
                    <div className="text-2xl font-bold text-[#C72030]">₹ {parseFloat(item.final_price || item.sale_price || 0).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-[#C72030] mt-1">Best price for end customer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Customer Discount</div>
                    <div className="text-base font-semibold text-[#C72030]">
                      {item.base_price && item.final_price
                        ? Math.round(((parseFloat(item.base_price) - parseFloat(item.final_price || item.sale_price)) / parseFloat(item.base_price)) * 100) + '% OFF'
                        : '0% OFF'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 underline">Technical Specifications</h3>
            <div className="grid grid-cols-1 gap-4">
              {item.published !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Published</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.published ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.featured !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Featured</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.featured ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.is_trending !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Trending</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.is_trending ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.is_bestseller !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Bestseller</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.is_bestseller ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.is_new_arrival !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">New Arrival</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.is_new_arrival ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.is_recommended !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Recommended</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.is_recommended ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.phone_required !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Phone Required</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.phone_required ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {item.redemption_fee_borne_by_user !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Fee Borne By User</div>
                  <div className="text-base font-semibold text-gray-900">
                    {item.redemption_fee_borne_by_user ? "Yes" : "No"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyInventoryDetails;
