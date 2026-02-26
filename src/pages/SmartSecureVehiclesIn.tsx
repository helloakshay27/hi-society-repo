import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  name: string;
  status: string;
  badgeColor?: string;
}

const dummyVehicles: Vehicle[] = [
  { id: 1, vehicleNumber: "62637mhehhe", name: "A-104", status: "V", badgeColor: "bg-yellow-500" },
  { id: 2, vehicleNumber: "MH07T0708", name: "Kahana / FM-Office", status: "V", badgeColor: "bg-blue-500" },
  { id: 3, vehicleNumber: "sa1212", name: "FM-Office", status: "V", badgeColor: "bg-blue-500" },
  { id: 4, vehicleNumber: "mh12aa1111", name: "FM-Office", status: "V", badgeColor: "bg-blue-500" }
];

const dummyHistory = [
  { id: 1, vehicleNumber: "MH07T0708", name: "Kahana / FM-Office", inTime: "09:15 AM", date: "2024-03-01" },
  { id: 2, vehicleNumber: "sa1212", name: "FM-Office", inTime: "10:30 AM", date: "2024-03-01" },
  { id: 3, vehicleNumber: "mh12aa1111", name: "FM-Office", inTime: "11:45 AM", date: "2024-02-29" },
  { id: 4, vehicleNumber: "62637mhehhe", name: "A-104", inTime: "02:00 PM", date: "2024-02-28" },
];

const entryGates = ["Gate 1", "Gate 2", "Gate 3", "Gate 4", "Main Gate"];

const SmartSecureVehiclesIn: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInModal, setShowInModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [entryGate, setEntryGate] = useState("");

  const filtered = dummyVehicles.filter((v) =>
    (v.vehicleNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIn = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEntryGate("");
    setShowInModal(true);
  };

  const handleSubmitEntry = () => {
    console.log("Entry submitted:", { vehicle: selectedVehicle, entryGate });
    setShowInModal(false);
  };

  return (
    <div className="p-6 bg-[#f6f4ee] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Visitor Vehicle In</h1>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex gap-3">
              <Button
                style={{ backgroundColor: '#C72030' }}
                className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded"
                onClick={() => setShowHistoryModal(true)}
              >
                History
              </Button>
              <Button style={{ backgroundColor: '#C72030' }} className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded">Vehicle In</Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search using Vehicle number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                />
              </div>
              <Button style={{ backgroundColor: '#C72030' }} className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded">Go!</Button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {filtered.length === 0 ? (
              <div className="text-gray-500">No vehicles found</div>
            ) : (
              filtered.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded flex items-center justify-center" style={{ backgroundColor: '#C72030' }}>
                      <svg className="w-8 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                      </svg>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-blue-600">{vehicle.vehicleNumber || vehicle.name}</span>
                        <span className={`w-6 h-6 ${vehicle.badgeColor || 'bg-blue-500'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>{vehicle.status}</span>
                      </div>
                      {vehicle.vehicleNumber && <span className="text-gray-600">{vehicle.name}</span>}
                    </div>
                  </div>

                  <Button onClick={() => handleIn(vehicle)} className="px-6 py-2 rounded" style={{ backgroundColor: "#f5ede8", color: "#C72030" }}>In</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Entry Popup */}
      {showInModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h2 className="text-base font-bold text-gray-900">Visitor Vehicle In</h2>
              <button onClick={() => setShowInModal(false)} className="text-red-500 hover:text-red-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-6 space-y-3">
              <label className="block text-sm font-semibold text-blue-600">Entry Gate</label>
              <select
                value={entryGate}
                onChange={(e) => setEntryGate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236b7280' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '18px' }}
              >
                <option value="">Select Entry Gate</option>
                {entryGates.map((gate) => (
                  <option key={gate} value={gate}>{gate}</option>
                ))}
              </select>

              <div className="pt-2">
                <button
                  onClick={handleSubmitEntry}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Vehicle In History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200">#</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200">Vehicle Number</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200">Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200">In Time</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyHistory.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 border-b border-gray-100 text-blue-600 font-medium">{record.vehicleNumber}</td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{record.name}</td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{record.inTime}</td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{record.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-4 border-t border-gray-200">
              <Button
                style={{ backgroundColor: '#C72030' }}
                className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded"
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSecureVehiclesIn;