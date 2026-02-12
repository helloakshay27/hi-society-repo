import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { toast } from "sonner";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";

export const LoyaltyInventoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const handleToggleActive = async (nextActive: boolean) => {
    if (!item?.id || isUpdatingStatus) {
      return;
    }

    const previousActive = isActive;

    try {
      setIsUpdatingStatus(true);
      setIsActive(nextActive);

      const url = `https://runwal-api.lockated.com/products/${id}.json?token=00f7c12e459b75225a07519c088edae3e9612e59d80111bb`;
      await axios.put(url, {
        product: {
          status: nextActive ? "active" : "inactive",
          published: nextActive,
        },
      });

      setItem((prev: any) =>
        prev
          ? {
            ...prev,
            status: nextActive ? "active" : "inactive",
            published: nextActive,
          }
          : prev
      );

      toast.success(`Product marked ${nextActive ? "active" : "inactive"}.`);
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
      setIsActive(previousActive);
    } finally {
      setIsUpdatingStatus(false);
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
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Images */}
        <div className="flex flex-col w-full md:w-[30%]">
          {item.banner_image?.url ? (
            <img
              src={item.banner_image.url}
              alt={item.name}
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
          <div className="flex gap-3 mt-3">
            {/* {item.featured && (
              <div className="bg-purple-100 rounded-lg px-4 py-2">
                <span className="text-sm font-semibold text-purple-700">Featured</span>
              </div>
            )}
            {item.is_recommended && (
              <div className="bg-yellow-100 rounded-lg px-4 py-2">
                <span className="text-sm font-semibold text-yellow-700">Recommended</span>
              </div>
            )} */}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex flex-col gap-6 w-full md:w-[70%]">
          {/* Product Name & Info Card */}
          <div className="bg-white w-full rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-semibold text-gray-400 uppercase">SKU: </span>
                <span className="text-sm font-semibold text-gray-400">{item.sku || "-"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                  className="data-[state=checked]:bg-green-500"
                  disabled={isUpdatingStatus}
                />
                <div className={`flex items-center gap-2 ${isActive ? 'bg-green-300' : 'bg-red-500'} px-3 py-1 rounded-lg`}>
                  <span className="text-xs font-medium uppercase">{isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#C72030] mb-2 uppercase">{item.name || "Unnamed Product"}</h2>
            <div className="text-sm text-gray-600 mb-4">
              {item.brand && <span>{item.brand}</span>}
              {item.brand && item.categories && <span className="mx-2">|</span>}
              {item.categories && <span>{item.categories}</span>}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Product Information</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {item.description || "No description available"}
              </p>
            </div>
          </div>

          {/* Pricing Structure Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 underline">Pricing Structure</h3>
            <div className="space-y-0">
              {/* Base Price */}
              {/* <div className="border-l-4 border-gray-300 pl-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Base Price</div>
                    <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(item.base_price || "0").toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div> */}

              {/* Client Price */}
              <div className="border-l-4 border-green-400 bg-green-50 pl-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Price</div>
                    <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(item.client_price || "0").toLocaleString('en-IN')}</div>
                    <div className="text-xs text-green-600 mt-1">After channel discount</div>
                  </div>
                </div>
              </div>

              {/* Customer Price */}
              <div className="border-l-4 border-[#C72030] pl-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Customer Price</div>
                    <div className="text-2xl font-bold text-[#C72030]">₹ {parseFloat(item.customer_price || "0").toLocaleString('en-IN')}</div>
                    <div className="text-xs text-[#C72030] mt-1">Best price for end customer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 underline">Technical Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* {item.value_type && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Value Type</div>
                  <div className="text-base font-semibold text-gray-900">{item.value_type}</div>
                </div>
              )} */}
              {item.validity && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Validity</div>
                  <div className="text-base font-semibold text-gray-900">{item.validity}</div>
                </div>
              )}
              {/* {item.usage_type && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Usage Type</div>
                  <div className="text-base font-semibold text-gray-900">{item.usage_type}</div>
                </div>
              )}
              {item.phone_required !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Phone Required</div>
                  <div className="text-base font-semibold text-gray-900">{item.phone_required ? 'Yes' : 'No'}</div>
                </div>
              )} */}
              {item.shipping_info && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Shipping Info</div>
                  <div className="text-base font-semibold text-gray-900">{item.shipping_info}</div>
                </div>
              )}
              {item.origin_country && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Origin Country</div>
                  <div className="text-base font-semibold text-gray-900">{item.origin_country}</div>
                </div>
              )}
              {/* {item.published !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Published</div>
                  <div className="text-base font-semibold text-gray-900">{item.published ? "Yes" : "No"}</div>
                </div>
              )}
              {item.featured !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Featured</div>
                  <div className="text-base font-semibold text-gray-900">{item.featured ? "Yes" : "No"}</div>
                </div>
              )}
              {item.is_trending !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Trending</div>
                  <div className="text-base font-semibold text-gray-900">{item.is_trending ? "Yes" : "No"}</div>
                </div>
              )}
              {item.is_bestseller !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Bestseller</div>
                  <div className="text-base font-semibold text-gray-900">{item.is_bestseller ? "Yes" : "No"}</div>
                </div>
              )}
              {item.is_new_arrival !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">New Arrival</div>
                  <div className="text-base font-semibold text-gray-900">{item.is_new_arrival ? "Yes" : "No"}</div>
                </div>
              )}
              {item.is_recommended !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Recommended</div>
                  <div className="text-base font-semibold text-gray-900">{item.is_recommended ? "Yes" : "No"}</div>
                </div>
              )}
              {item.redemption_fee_borne_by_user !== undefined && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Fee Borne By User</div>
                  <div className="text-base font-semibold text-gray-900">{item.redemption_fee_borne_by_user ? "Yes" : "No"}</div>
                </div>
              )}
              {item.value_denominations && (
                <div className="border-l-4 border-[#C72030] bg-gray-50 pl-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">Available Denominations</div>
                  <div className="text-base font-semibold text-gray-900">{item.value_denominations}</div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Redemption Instructions & Terms Cards */}
      {(item.redemption_instructions || item.terms_and_conditions) && (
        <div className="grid grid-cols-1 gap-6 mt-6 lg:col-span-2">
          {item.redemption_instructions && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Redemption Instructions</h3>
              <div
                className="text-base text-gray-700 leading-7 bg-blue-50 p-4 rounded-lg border border-blue-100 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>li]:mb-2"
                dangerouslySetInnerHTML={{ __html: item.redemption_instructions }}
              />
            </div>
          )}

          {item.terms_and_conditions && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 underline">Terms & Conditions</h3>
              <div
                className="text-base text-gray-600 leading-7 bg-gray-50 p-4 rounded-lg border border-gray-200 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>li]:mb-2"
                dangerouslySetInnerHTML={{ __html: item.terms_and_conditions }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoyaltyInventoryDetails;
