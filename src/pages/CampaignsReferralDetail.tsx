import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

const CampaignsReferralDetail: React.FC = () => {
  const { id } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);

  // Sample data - in real app, fetch based on ID
  const [referralData, setReferralData] = useState({
    id: "#1393",
    referCode: "173f347f",
    referTo: "Kshitij Rasal",
    referedBy: "Kshitij Rasal",
    project: "GODREJ HILL RETREAT",
    mobile: "9819808570",
    status: "Hot",
    clientEmail: "",
    leadStage: "Round Table",
    createdOn: "11/09/2023 4: 34 PM",
    notes: [
      { text: "Great", timestamp: "11/09/2023/ 4: 36 PM" },
      { text: "Test", timestamp: "24/03/2025/ 3: 14 PM" },
    ],
  });

  const [editForm, setEditForm] = useState({
    status: referralData.status,
    leadStage: referralData.leadStage,
    notes: "",
  });

  const handleSave = () => {
    // Handle save logic here - connect to API
    setShowEditModal(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-normal text-gray-700">Detail</h1>
            <Button
              onClick={() => setShowEditModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Edit
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Grid Layout for Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* ID */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">ID</label>
                <p className="text-gray-800">{referralData.id}</p>
              </div>

              {/* Refered by */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Refered by
                </label>
                <p className="text-gray-800">{referralData.referedBy}</p>
              </div>

              {/* Refer Code */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Refer Code
                </label>
                <p className="text-gray-800">{referralData.referCode}</p>
              </div>

              {/* Project */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Project
                </label>
                <p className="text-gray-800">{referralData.project}</p>
              </div>

              {/* Refer to */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Refer to
                </label>
                <p className="text-gray-800">{referralData.referTo}</p>
              </div>

              {/* Mobile */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Mobile
                </label>
                <p className="text-gray-800">{referralData.mobile}</p>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Status
                </label>
                <p className="text-gray-800">{referralData.status}</p>
              </div>

              {/* Client Email */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Client Email
                </label>
                <p className="text-gray-800">
                  {referralData.clientEmail || "-"}
                </p>
              </div>

              {/* Lead Stage */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Lead Stage
                </label>
                <p className="text-gray-800">{referralData.leadStage}</p>
              </div>
            </div>

            {/* Created on - Full Width */}
            <div className="mt-6 pb-6 border-b border-gray-200">
              <label className="text-sm text-gray-600 block mb-1">
                Created on
              </label>
              <p className="text-gray-800">{referralData.createdOn}</p>
            </div>

            {/* Notes Section */}
            <div className="mt-6">
              <h2 className="text-lg font-normal text-gray-700 mb-4">Notes</h2>
              <div className="space-y-3">
                {referralData.notes.map((note, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded p-4 flex items-start justify-between"
                  >
                    <p className="text-gray-800">{note.text}</p>
                    <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                      {note.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-normal">Edit</DialogTitle>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-red-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm text-gray-700">
                Status
              </Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Stage */}
            <div className="space-y-2">
              <Label htmlFor="leadStage" className="text-sm text-gray-700">
                Lead Stage
              </Label>
              <Select
                value={editForm.leadStage}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, leadStage: value })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select lead stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Round Table">Round Table</SelectItem>
                  <SelectItem value="Site Visit">Site Visit</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm text-gray-700">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder=""
                className="min-h-[100px] bg-white"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleSave}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-8"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsReferralDetail;
