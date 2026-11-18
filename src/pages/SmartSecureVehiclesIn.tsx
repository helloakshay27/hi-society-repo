import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  name: string;
  status: "H" | "G";
  phone?: string;
}

const dummyVehicles: Vehicle[] = [
  { id: 1, vehicleNumber: "626373hhehhe", name: "A-104", status: "H" },
  { id: 2, vehicleNumber: "sa1212", name: "FM-Office", status: "H" },
  { id: 3, vehicleNumber: "mh12aa1111", name: "FM-Office", status: "H" },
  { id: 4, vehicleNumber: "mh1212", name: "FM-Office", status: "H" },
  { id: 5, vehicleNumber: "MH05R0908", name: "FM-Office", status: "H" },
  { id: 6, vehicleNumber: "MH44Y5678", name: "FM-Office", status: "H" },
  { id: 7, vehicleNumber: "MH23T2353", name: "Varun / FM-Office", status: "G", phone: "8530312827" },
];

const entryGateOptions = ["Gate 1", "Gate 2", "Gate 3", "Gate 4", "Main Gate"];

const vehicleColumns: ColumnConfig[] = [
  { key: "sr_no",         label: "Sr. No.",         sortable: false, hideable: true,  draggable: true },
  { key: "vehicleNumber", label: "Vehicle Number",  sortable: true,  hideable: true,  draggable: true },
  { key: "name",          label: "Name / Location", sortable: true,  hideable: true,  draggable: true },
  { key: "status",        label: "Type",            sortable: false, hideable: true,  draggable: true },
  { key: "action",        label: "Action",          sortable: false, hideable: false, draggable: false },
];

const SmartSecureVehiclesIn: React.FC = () => {
  const [showInModal, setShowInModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedGate, setSelectedGate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleIn = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedGate("");
    setShowInModal(true);
  };

  const handleCloseInModal = () => {
    if (submitting) return;
    setShowInModal(false);
    setSelectedVehicle(null);
    setSelectedGate("");
  };

  const handleSubmit = () => {
    if (!selectedGate) return;
    setSubmitting(true);
    // Simulate submit; wire up to a real API when available.
    setTimeout(() => {
      setSubmitting(false);
      setShowInModal(false);
      setSelectedVehicle(null);
      setSelectedGate("");
    }, 400);
  };

  const renderVehicleCell = (item: Vehicle, columnKey: string, index: number) => {
    switch (columnKey) {
      case "sr_no":
        return <span className="text-sm text-gray-500 font-medium">{index + 1}</span>;

      case "vehicleNumber":
        return <span className="font-semibold text-black-600">{item.vehicleNumber}</span>;

      case "name":
        return (
          <div>
            <div className="text-sm text-gray-800">{item.name}</div>
            {item.phone && <div className="text-gray-500 text-sm">{item.phone}</div>}
          </div>
        );

      case "status":
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            item.status === "H"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {item.status === "H" ? "Host" : "Guest"}
          </span>
        );

      case "action":
        return (
          <Button
            size="sm"
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white text-xs px-3 py-1 h-7"
            onClick={() => handleIn(item)}
          >
            In
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <EnhancedTable
        data={dummyVehicles}
        columns={vehicleColumns}
        renderCell={renderVehicleCell}
        storageKey="vehicles-in-table"
        enableSearch={true}
        searchPlaceholder="Search by vehicle number, name..."
        emptyMessage="No vehicles waiting to enter"
      />

      {/* Vehicle In Modal */}
      <Dialog open={showInModal} onOpenChange={handleCloseInModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Visitor Vehicle In</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {selectedVehicle && (
              <div className="bg-gray-50 rounded px-3 py-2 text-sm">
                <span className="text-gray-500">Vehicle: </span>
                <span className="font-semibold text-gray-800">{selectedVehicle.vehicleNumber}</span>
                <span className="text-gray-400 mx-2">·</span>
                <span className="text-gray-600">{selectedVehicle.name}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Entry Gate</label>
              <select
                title="Entry Gate"
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030]"
              >
                <option value="" disabled>Select Entry Gate</option>
                {entryGateOptions.map((gate) => (
                  <option key={gate} value={gate}>{gate}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseInModal} disabled={submitting}>Cancel</Button>
            <Button
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white min-w-[90px]"
              onClick={handleSubmit}
              disabled={submitting || !selectedGate}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SmartSecureVehiclesIn;
