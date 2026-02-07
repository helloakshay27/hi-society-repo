import React from "react";

export const LoyaltyInventoryDetails = () => {
  // Demo data (replace with actual API data)
  const item = {
    name: "BOSE QUIETCOMFORT HEADPHONES",
    sku: "BOSE-QC-HEADPHONES",
    brand: "BOSE",
    currentStock: 1020,
    totalSold: 760,
    lastSoldDate: "2026-01-24",
    description:
      "Product information: Bose creates over-ear headphones designed for comfort and clarity, including noise-cancelling features and wireless connectivity. These headphones are ideal for everyday listening, travel, and work.",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=200&q=80",
    ],
    pricing: {
      mrp: 15500,
      clientPrice: 13900,
      pointsRequired: 1200,
      discount: 10,
    },
    specs: {
      type: "Over Ear",
      wireless: "Yes",
      noiseCancelling: "Yes",
      batteryLife: "20 hours",
      color: "White / Others Colours Available",
      warranty: "1 year",
      chargingTime: "1 hour",
      connectivityType: "USB",
    },
  };

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 mb-2">Current Stock</div>
          <div className="text-3xl font-bold text-[#C72030]">{item.currentStock}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 mb-2">Total Sold</div>
          <div className="text-3xl font-bold text-[#C72030]">{item.totalSold}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 mb-2">Last Sold</div>
          <div className="text-3xl font-bold text-[#C72030]">{item.lastSoldDate}</div>
        </div>
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              <img src={item.images[0]} alt="Main" className="w-full h-80 object-contain" />
            </div>
            <div className="flex gap-3">
              <div className="bg-pink-200 rounded-lg p-4 flex items-center justify-center w-24 h-24">
                <img src={item.images[1]} alt="Pink variant" className="w-full h-full object-contain opacity-70" />
              </div>
              <div className="bg-orange-200 rounded-lg p-4 flex items-center justify-center w-24 h-24">
                <img src={item.images[2]} alt="Orange variant" className="w-full h-full object-contain opacity-70" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-3">
              <span className="text-xs text-gray-400 uppercase">SKU: </span>
              <span className="text-sm font-semibold text-[#C72030]">{item.sku}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#C72030] mb-4 uppercase">{item.name}</h2>
            
            {/* Product Information */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Information</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Pricing Structure */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Pricing Structure</h3>
                <button className="text-xs text-[#C72030] bg-pink-50 px-3 py-1 rounded">Edit Pricing</button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">MRP</span>
                  <div className="flex items-center gap-8">
                    <span className="text-sm font-semibold text-gray-900">₹ {item.pricing.mrp.toLocaleString()}</span>
                    <span className="text-xs text-green-600 w-16 text-right">{item.pricing.discount}% Off</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Client Price</span>
                  <div className="flex items-center gap-8">
                    <span className="text-sm font-semibold text-gray-900">₹ {item.pricing.clientPrice.toLocaleString()}</span>
                    <span className="text-xs text-red-600 w-16 text-right">{item.pricing.discount}% Off</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Points Required</span>
                  <div className="flex items-center gap-8">
                    <span className="text-sm font-semibold text-gray-900">{item.pricing.pointsRequired}</span>
                    <span className="text-xs text-gray-400 w-16 text-right">Redemption</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Technical Specifications</h3>
                <button className="text-xs text-[#C72030] bg-pink-50 px-3 py-1 rounded">Edit Specs</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Type</div>
                  <div className="text-sm text-gray-900">{item.specs.type}</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Noise Cancelling</div>
                  <div className="text-sm text-gray-900">{item.specs.noiseCancelling}</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Wireless</div>
                  <div className="text-sm text-gray-900">{item.specs.wireless}</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Battery Life</div>
                  <div className="text-sm text-gray-900">{item.specs.batteryLife}</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Charging Time</div>
                  <div className="text-sm text-gray-900">{item.specs.chargingTime}</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Connectivity Type</div>
                  <div className="text-sm text-gray-900">{item.specs.connectivityType}</div>
                </div>
                <div className="border border-gray-200 rounded p-3 col-span-2">
                  <div className="text-xs text-gray-400 mb-1">Color</div>
                  <div className="text-sm text-gray-900">{item.specs.color}</div>
                </div>
                <div className="border border-gray-200 rounded p-3 col-span-2">
                  <div className="text-xs text-gray-400 mb-1">Warranty</div>
                  <div className="text-sm text-gray-900">{item.specs.warranty}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyInventoryDetails;
