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
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="25" viewBox="0 0 28 25" fill="none">
            <path d="M27.5687 13.6775L22.2562 9.99999L27.5687 6.32249C27.7018 6.23049 27.8105 6.10759 27.8856 5.96434C27.9607 5.82108 28 5.66174 28 5.49999C28 5.33824 27.9607 5.1789 27.8856 5.03564C27.8105 4.89239 27.7018 4.76949 27.5687 4.67749L21.0687 0.177489C20.9016 0.0619115 20.7032 0 20.5 0C20.2968 0 20.0984 0.0619115 19.9312 0.177489L14 4.28374L8.06874 0.177489C7.90159 0.0619115 7.7032 0 7.49998 0C7.29677 0 7.09838 0.0619115 6.93123 0.177489L0.431235 4.67749C0.298194 4.76949 0.189455 4.89239 0.114346 5.03564C0.0392373 5.1789 0 5.33824 0 5.49999C0 5.66174 0.0392373 5.82108 0.114346 5.96434C0.189455 6.10759 0.298194 6.23049 0.431235 6.32249L5.74998 9.99999L0.437485 13.6775C0.304444 13.7695 0.195705 13.8924 0.120596 14.0356C0.0454875 14.1789 0.00625014 14.3382 0.00625014 14.5C0.00625014 14.6617 0.0454875 14.8211 0.120596 14.9643C0.195705 15.1076 0.304444 15.2305 0.437485 15.3225L6.93748 19.8225C7.10463 19.9381 7.30302 20 7.50624 20C7.70945 20 7.90784 19.9381 8.07498 19.8225L14 15.7162L19.9312 19.8225C20.0984 19.9381 20.2968 20 20.5 20C20.7032 20 20.9016 19.9381 21.0687 19.8225L27.5687 15.3225C27.7018 15.2305 27.8105 15.1076 27.8856 14.9643C27.9607 14.8211 28 14.6617 28 14.5C28 14.3382 27.9607 14.1789 27.8856 14.0356C27.8105 13.8924 27.7018 13.7695 27.5687 13.6775ZM14 13.2837L9.25624 9.99999L14.0062 6.71624L18.75 9.99999L14 13.2837ZM20.5 2.21624L25.25 5.49999L20.5 8.78374L15.7562 5.49999L20.5 2.21624ZM7.49998 2.21624L12.25 5.49999L7.49998 8.78374L2.75623 5.49999L7.49998 2.21624ZM7.49998 17.7837L2.75623 14.5L7.50624 11.2162L12.25 14.5L7.49998 17.7837ZM20.5 17.7837L15.7562 14.5L20.5 11.2162L25.25 14.5L20.5 17.7837ZM17.8087 20.8637C17.9599 21.0814 18.0186 21.3502 17.9717 21.6111C17.9248 21.872 17.7763 22.1036 17.5587 22.255L14.5725 24.3225C14.4053 24.4381 14.2069 24.5 14.0037 24.5C13.8005 24.5 13.6021 24.4381 13.435 24.3225L10.445 22.25C10.2281 22.0987 10.0799 21.8675 10.033 21.6072C9.98608 21.3469 10.0442 21.0786 10.1946 20.8611C10.3451 20.6435 10.5756 20.4944 10.8357 20.4464C11.0958 20.3985 11.3643 20.4555 11.5825 20.605L14 22.2837L16.4175 20.61C16.6356 20.4592 16.9048 20.4011 17.1657 20.4487C17.4266 20.4963 17.6579 20.6456 17.8087 20.8637Z" fill="#C72030" />
          </svg>}
          iconRounded={true}
          valueColor="text-[#1A1A1A]"
        />
        <StatsCard
          title="Total Sold"
          value={item.total_sold ?? 0}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="25" height="28" viewBox="0 0 25 28" fill="none">
            <path d="M18.895 7H22.991C23.2387 7.00024 23.4776 7.09244 23.6612 7.25871C23.8449 7.42499 23.9602 7.65351 23.985 7.9L24.595 14H22.583L22.083 9H18.895V12C18.895 12.2652 18.7897 12.5196 18.6021 12.7071C18.4146 12.8946 18.1602 13 17.895 13C17.6298 13 17.3754 12.8946 17.1879 12.7071C17.0004 12.5196 16.895 12.2652 16.895 12V9H8.89501V12C8.89501 12.2652 8.78966 12.5196 8.60212 12.7071C8.41458 12.8946 8.16023 13 7.89501 13C7.6298 13 7.37544 12.8946 7.18791 12.7071C7.00037 12.5196 6.89501 12.2652 6.89501 12V9H3.70501L2.10501 25H12.895V27H0.999013C0.859341 26.9999 0.721246 26.9705 0.593627 26.9137C0.466007 26.8569 0.351693 26.7741 0.258049 26.6705C0.164405 26.5668 0.0935088 26.4447 0.0499272 26.312C0.00634557 26.1793 -0.00895462 26.039 0.00501268 25.9L1.80501 7.9C1.82979 7.65351 1.94517 7.42499 2.12881 7.25871C2.31246 7.09244 2.55128 7.00024 2.79901 7H6.89501V6.302C6.89501 2.834 9.56701 0 12.895 0C16.223 0 18.895 2.834 18.895 6.302V7.002V7ZM16.895 7V6.302C16.895 3.914 15.091 2 12.895 2C10.699 2 8.89501 3.914 8.89501 6.302V7.002H16.895V7ZM23.189 21.88C23.2802 21.7807 23.3906 21.701 23.5134 21.6454C23.6363 21.5899 23.7691 21.5598 23.9039 21.5569C24.0386 21.554 24.1726 21.5784 24.2977 21.6286C24.4228 21.6788 24.5365 21.7538 24.6319 21.8491C24.7273 21.9443 24.8024 22.0579 24.8528 22.1829C24.9032 22.308 24.9278 22.4419 24.9251 22.5767C24.9224 22.7115 24.8925 22.8443 24.8371 22.9672C24.7818 23.0902 24.7021 23.2006 24.603 23.292L20.603 27.292C20.4155 27.4795 20.1612 27.5848 19.896 27.5848C19.6308 27.5848 19.3765 27.4795 19.189 27.292L15.189 23.292C15.0935 23.1998 15.0173 23.0894 14.9649 22.9674C14.9125 22.8454 14.8849 22.7142 14.8838 22.5814C14.8826 22.4486 14.9079 22.3169 14.9582 22.194C15.0085 22.0711 15.0827 21.9595 15.1766 21.8656C15.2705 21.7717 15.3822 21.6975 15.5051 21.6472C15.628 21.5969 15.7596 21.5716 15.8924 21.5728C16.0252 21.5739 16.1564 21.6015 16.2784 21.6539C16.4004 21.7063 16.5108 21.7825 16.603 21.878L18.895 24.172V17C18.895 16.7348 19.0004 16.4804 19.1879 16.2929C19.3754 16.1054 19.6298 16 19.895 16C20.1602 16 20.4146 16.1054 20.6021 16.2929C20.7897 16.4804 20.895 16.7348 20.895 17V24.172L23.189 21.878V21.88Z" fill="#C72030" />
          </svg>}
          iconRounded={true}
          valueColor="text-[#1A1A1A]"
        />
        <StatsCard
          title="Last Order Restocked"
          value={item.updated_at ? item.updated_at.slice(0, 10) : "-"}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="25" height="26" viewBox="0 0 25 26" fill="none">
            <path d="M22.8244 0.992366H21.9329C21.9559 0.918534 21.9797 0.844702 21.9797 0.762931C21.9797 0.342168 21.6368 0 21.2152 0C20.7936 0 20.4523 0.342168 20.4523 0.762931C20.4523 0.844702 20.4745 0.918534 20.4991 0.992366H17.5776C17.6006 0.918534 17.6244 0.844702 17.6244 0.762931C17.6228 0.342168 17.2815 0 16.8591 0C16.4384 0 16.0962 0.342168 16.0962 0.762931C16.0962 0.844702 16.1192 0.918534 16.143 0.992366H13.2199C13.2429 0.918534 13.2667 0.844702 13.2667 0.762931C13.2667 0.342168 12.9254 0 12.5038 0C12.0823 0 11.7409 0.342168 11.7409 0.762931C11.7409 0.844702 11.7631 0.918534 11.7869 0.992366H8.86461C8.88763 0.918534 8.91145 0.844702 8.91145 0.762931C8.91145 0.342168 8.56928 0 8.14852 0C7.72696 0 7.38479 0.342168 7.38479 0.762931C7.38479 0.844702 7.40702 0.918534 7.43084 0.992366H4.50931C4.53313 0.918534 4.55615 0.844702 4.55615 0.762931C4.55615 0.341374 4.21478 0 3.79322 0C3.37166 0 3.0295 0.342168 3.0295 0.762931C3.0295 0.844702 3.05173 0.918534 3.07554 0.992366H2.18321C0.978076 0.992366 0 1.97124 0 3.17557V23.8168C0 25.0219 0.978076 26 2.18321 26H20.3594L25.0076 21.3518V3.17557C25.0076 1.97124 24.0296 0.992366 22.8244 0.992366ZM23.8168 20.858L23.5699 21.1049H21.7003C20.8254 21.1049 20.1125 21.8194 20.1125 22.6926V24.5623L19.8656 24.8092H2.18321C1.63621 24.8092 1.19084 24.3638 1.19084 23.8168V3.96947H23.8168V20.858Z" fill="#C72030" />
            <path d="M11.4519 18.8011H13.5573V15.6406H16.7162V13.5352H13.5573V10.3755H11.4519V13.5352H8.29297V15.6406H11.4519V18.8011Z" fill="#C72030" />
            <path d="M12.5027 22.4108C16.8159 22.4108 20.3249 18.9018 20.3249 14.5878C20.3249 10.2738 16.8159 6.76477 12.5027 6.76477C8.18869 6.76477 4.67969 10.2738 4.67969 14.5878C4.67969 18.9018 8.18869 22.4108 12.5027 22.4108ZM12.5027 7.96831C16.1522 7.96831 19.1214 10.9383 19.1214 14.5878C19.1214 18.2381 16.1522 21.2073 12.5027 21.2073C8.85239 21.2073 5.88244 18.2381 5.88244 14.5878C5.88244 10.9383 8.85239 7.96831 12.5027 7.96831Z" fill="#C72030" />
          </svg>}
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
