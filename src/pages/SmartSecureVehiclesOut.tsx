import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X, DoorOpen, Clock, User } from "lucide-react";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  name: string;
  status: string;
  badgeColor?: string;
}

interface HistoryRecord {
  id: number;
  vehicleNumber: string;
  visitorName: string;
  exitGate: string;
  dateTime: string;
}

const dummyVehicles: Vehicle[] = [
  { id: 1, vehicleNumber: "62637mhehhe", name: "A-104", status: "V", badgeColor: "bg-yellow-500" },
  { id: 2, vehicleNumber: "MH07T0708", name: "Kahana / FM-Office", status: "V", badgeColor: "bg-blue-500" },
  { id: 3, vehicleNumber: "sa1212", name: "FM-Office", status: "V", badgeColor: "bg-blue-500" },
  { id: 4, vehicleNumber: "mh12aa1111", name: "FM-Office", status: "V", badgeColor: "bg-blue-500" }
];

const dummyHistory: HistoryRecord[] = [
  { id: 1, vehicleNumber: "MH07T0708", visitorName: "Rahul Sharma", exitGate: "Main Gate", dateTime: "25 Feb 2026, 10:30 AM" },
  { id: 2, vehicleNumber: "sa1212", visitorName: "Priya Mehta", exitGate: "Gate 1", dateTime: "25 Feb 2026, 11:15 AM" },
  { id: 3, vehicleNumber: "mh12aa1111", visitorName: "Amit Verma", exitGate: "Gate 2", dateTime: "24 Feb 2026, 04:45 PM" },
  { id: 4, vehicleNumber: "62637mhehhe", visitorName: "Sneha Patil", exitGate: "Gate 3", dateTime: "24 Feb 2026, 02:00 PM" },
];

const exitGateOptions = ["Gate 1", "Gate 2", "Gate 3", "Main Gate"];

const SmartSecureVehiclesOut: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOutModal, setShowOutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedGate, setSelectedGate] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const filtered = dummyVehicles.filter((v) =>
    (v.vehicleNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = dummyHistory.filter((h) =>
    h.vehicleNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.visitorName.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.exitGate.toLowerCase().includes(historySearch.toLowerCase())
  );

  const handleOut = (id: number) => {
    setSelectedVehicleId(id);
    setSelectedGate("");
    setShowOutModal(true);
  };

  const handleSubmit = () => {
    if (!selectedGate) {
      alert("Please select an exit gate.");
      return;
    }
    console.log("Vehicle out:", selectedVehicleId, "Exit Gate:", selectedGate);
    setShowOutModal(false);
    setSelectedVehicleId(null);
    setSelectedGate("");
  };

  const handleCloseOutModal = () => {
    setShowOutModal(false);
    setSelectedVehicleId(null);
    setSelectedGate("");
  };

  return (
    <div className="p-6 bg-[#f6f4ee] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Visitor Vehicle Out</h1>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex gap-3">
              <Button
                style={{ backgroundColor: '#C72030' }}
                className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded"
                onClick={() => { setHistorySearch(""); setShowHistoryModal(true); }}
              >
                History
              </Button>
              <Button style={{ backgroundColor: '#C72030' }} className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded">Vehicle Out</Button>
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
                    <div className="w-16 h-12 bg-blue-500 rounded flex items-center justify-center">
                      <svg className="w-8 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.01.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
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
                  <Button onClick={() => handleOut(vehicle.id)} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded">Out</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Vehicle Out Modal ── */}
      {showOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-300">
              <h2 className="text-base font-semibold text-gray-800">Visitor Vehicle Out</h2>
              <button onClick={handleCloseOutModal} className="text-red-500 hover:text-red-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-blue-600 mb-2">Exit Gate</label>
              <div className="relative">
                <select
                  value={selectedGate}
                  onChange={(e) => setSelectedGate(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>Select Exit Gate</option>
                  {exitGateOptions.map((gate) => (
                    <option key={gate} value={gate}>{gate}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">&#8964;</div>
              </div>
            </div>
            <div className="flex justify-center pb-5">
              <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2 rounded transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-[580px] max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-b border-gray-300">
              <h2 className="text-base font-semibold text-gray-800">Vehicle Out History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-red-500 hover:text-red-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-5 py-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by vehicle, visitor or gate..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Cards */}
            <div className="overflow-y-auto p-5 space-y-3 flex-1">
              {filteredHistory.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No history records found.</div>
              ) : (
                filteredHistory.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">

                    {/* Top row: vehicle icon + number + OUT badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-9 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.01.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                        </svg>
                      </div>
                      <span className="text-base font-bold text-blue-600 tracking-wide">{record.vehicleNumber}</span>
                      <span className="ml-auto text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Out</span>
                    </div>

                    {/* Info grid: Visitor | Exit Gate | Date & Time */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="flex items-start gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Visitor Name</p>
                          <p className="font-medium text-gray-700">{record.visitorName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Exit Gate</p>
                          <p className="font-medium text-gray-700">{record.exitGate}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Date & Time</p>
                          <p className="font-medium text-gray-700">{record.dateTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">{filteredHistory.length} record{filteredHistory.length !== 1 ? "s" : ""} found</span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="bg-[#C72030] hover:bg-[#C72030]/90 text-white px-5 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSecureVehiclesOut;