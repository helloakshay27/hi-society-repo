import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  name: string;
  status: string;
  badgeColor?: string;
  phone?: string;
}

const dummyVehicles: Vehicle[] = [
  { id: 1, vehicleNumber: "626373hhehhe", name: "A-104", status: "H", badgeColor: "bg-yellow-500" },
  { id: 2, vehicleNumber: "sa1212", name: "FM-Office", status: "H", badgeColor: "bg-yellow-500" },
  { id: 3, vehicleNumber: "mh12aa1111", name: "FM-Office", status: "H", badgeColor: "bg-yellow-500" },
  { id: 4, vehicleNumber: "mh1212", name: "FM-Office", status: "H", badgeColor: "bg-yellow-500" },
  { id: 5, vehicleNumber: "MH05R0908", name: "FM-Office", status: "H", badgeColor: "bg-yellow-500" },
  { id: 6, vehicleNumber: "MH44Y5678", name: "FM-Office", status: "H", badgeColor: "bg-yellow-500" },
  { id: 7, vehicleNumber: "MH23T2353", name: "Varun / FM-Office", status: "G", badgeColor: "bg-green-600", phone: "8530312827" },
];

interface HistoryRecord {
  id: number;
  vehicleNumber: string;
  visitorName: string;
  entryGate: string;
  dateTime: string;
}

const dummyHistory: HistoryRecord[] = [
  { id: 1, vehicleNumber: "MH07T0708", visitorName: "Rahul Sharma", entryGate: "Main Gate", dateTime: "25 Feb 2026, 10:30 AM" },
  { id: 2, vehicleNumber: "sa1212", visitorName: "Priya Mehta", entryGate: "Gate 1", dateTime: "25 Feb 2026, 11:15 AM" },
  { id: 3, vehicleNumber: "mh12aa1111", visitorName: "Amit Verma", entryGate: "Gate 2", dateTime: "24 Feb 2026, 04:45 PM" },
  { id: 4, vehicleNumber: "626373hhehhe", visitorName: "Sneha Patil", entryGate: "Gate 3", dateTime: "24 Feb 2026, 02:00 PM" },
];

const entryGateOptions = ["Gate 1", "Gate 2", "Gate 3", "Gate 4", "Main Gate"];

const vehicleColumns = [
  { key: "vehicleNumber", label: "Vehicle Number", sortable: true },
  { key: "name", label: "Name / Location", sortable: true },
  { key: "status", label: "Status", sortable: false },
  { key: "actions", label: "Action", sortable: false },
];

const historyColumns = [
  { key: "vehicleNumber", label: "Vehicle Number", sortable: true },
  { key: "visitorName", label: "Visitor Name", sortable: true },
  { key: "entryGate", label: "Entry Gate", sortable: true },
  { key: "dateTime", label: "Date & Time", sortable: true },
];

const SmartSecureVehiclesIn: React.FC = () => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInModal, setShowInModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedGate, setSelectedGate] = useState("");

  const handleIn = (id: number) => {
    setSelectedVehicleId(id);
    setSelectedGate("");
    setShowInModal(true);
  };

  const handleSubmit = () => {
    if (!selectedGate) {
      alert("Please select an entry gate.");
      return;
    }
    setShowInModal(false);
    setSelectedVehicleId(null);
    setSelectedGate("");
  };

  const handleCloseInModal = () => {
    setShowInModal(false);
    setSelectedVehicleId(null);
    setSelectedGate("");
  };

  const renderVehicleCell = (item: Vehicle, columnKey: string) => {
    switch (columnKey) {
      case "vehicleNumber":
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C72030" }}>
              <svg className="w-6 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
            </div>
            <span className="text-blue-600 font-semibold">{item.vehicleNumber}</span>
          </div>
        );
      case "name":
        return (
          <div>
            <div className="text-gray-800">{item.name}</div>
            {item.phone && <div className="text-gray-500 text-sm">{item.phone}</div>}
          </div>
        );
      case "status":
        return (
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-white text-xs font-bold ${item.badgeColor || "bg-yellow-500"}`}>
            {item.status}
          </span>
        );
      default:
        return null;
    }
  };

  const renderVehicleActions = (item: Vehicle) => (
    <button
      onClick={() => handleIn(item.id)}
      className="border border-[#C72030] text-[#C72030] px-5 py-1 rounded text-sm font-semibold hover:bg-[#C72030]/5 transition-colors"
    >
      IN
    </button>
  );

  const renderHistoryCell = (item: HistoryRecord, columnKey: string) => {
    switch (columnKey) {
      case "vehicleNumber":
        return <span className="text-blue-600 font-medium">{item.vehicleNumber}</span>;
      case "visitorName":
        return item.visitorName;
      case "entryGate":
        return item.entryGate;
      case "dateTime":
        return item.dateTime;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-[#f6f4ee] min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visitor Vehicle In</h1>

      <EnhancedTable
        data={dummyVehicles}
        columns={vehicleColumns}
        renderCell={renderVehicleCell}
        renderActions={renderVehicleActions}
        storageKey="vehicles-in-table"
        enableSearch={true}
        searchPlaceholder="Search using Vehicle number"
        leftActions={
          <Button
            style={{ backgroundColor: "#C72030" }}
            className="hover:bg-[#C72030]/90 text-white px-6 py-2 rounded"
            onClick={() => setShowHistoryModal(true)}
          >
            History
          </Button>
        }
      />

      {/* Vehicle In Modal */}
      {showInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-300">
              <h2 className="text-base font-semibold text-gray-800">Visitor Vehicle In</h2>
              <button onClick={handleCloseInModal} className="text-red-500 hover:text-red-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-blue-600 mb-2">Entry Gate</label>
              <div className="relative">
                <select
                  value={selectedGate}
                  onChange={(e) => setSelectedGate(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>Select Entry Gate</option>
                  {entryGateOptions.map((gate) => (
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

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-[750px] max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-b border-gray-300">
              <h2 className="text-base font-semibold text-gray-800">Vehicle In History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-red-500 hover:text-red-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <EnhancedTable
                data={dummyHistory}
                columns={historyColumns}
                renderCell={renderHistoryCell}
                storageKey="vehicles-in-history-table"
                enableSearch={true}
                searchPlaceholder="Search by vehicle, visitor or gate..."
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
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

export default SmartSecureVehiclesIn;
