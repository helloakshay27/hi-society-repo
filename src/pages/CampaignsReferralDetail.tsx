import React, { useState, useEffect } from "react";
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
import {
  getCampaignReferralById,
  getLeadStages,
  CampaignReferral,
  LeadStage,
} from "@/services/campaignReferralService";

const CampaignsReferralDetail: React.FC = () => {
  const { id } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadStages, setLeadStages] = useState<LeadStage[]>([]);

  const [referralData, setReferralData] = useState<CampaignReferral | null>(
    null
  );

  const [editForm, setEditForm] = useState({
    status: "",
    leadStage: "",
    notes: "",
  });

  // Fetch referral detail and lead stages
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);
      try {
        const [data, stagesData] = await Promise.all([
          getCampaignReferralById(parseInt(id, 10)),
          getLeadStages(),
        ]);

        setReferralData(data);
        setLeadStages(Array.isArray(stagesData) ? stagesData : []);
        setEditForm({
          status: data.status || "",
          leadStage: data.lead_stage_id ? String(data.lead_stage_id) : "",
          notes: "",
        });
      } catch (err) {
        console.error("Failed to fetch referral detail:", err);
        setError("Failed to load referral detail. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  const getLeadStageName = (stageId: number | null) => {
    if (!stageId) return "-";
    const stage = leadStages.find((s) => s.id === stageId);
    return stage ? stage.lead_stage : "-";
  };

  const handleSave = () => {
    // Handle save logic here - connect to API
    setShowEditModal(false);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="text-gray-600">No referral data found.</div>
      </div>
    );
  }

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
                <p className="text-gray-800">#{referralData.id}</p>
              </div>

              {/* Refer Name */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Refer Name
                </label>
                <p className="text-gray-800">
                  {referralData.ref_name || "-"}
                </p>
              </div>

              {/* Referral Code */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Referral Code
                </label>
                <p className="text-gray-800">
                  {referralData.referral_code || "-"}
                </p>
              </div>

              {/* Project */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Project
                </label>
                <p className="text-gray-800">
                  {referralData.project_name || "-"}
                </p>
              </div>

              {/* Mobile */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Mobile
                </label>
                <p className="text-gray-800">
                  {referralData.ref_phone || "-"}
                </p>
              </div>

              {/* Alternate Mobile */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Alternate Mobile
                </label>
                <p className="text-gray-800">
                  {referralData.alternate_mob || "-"}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Status
                </label>
                <p className="text-gray-800">
                  {referralData.status || "-"}
                </p>
              </div>

              {/* Client Email */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Client Email
                </label>
                <p className="text-gray-800">
                  {referralData.client_email || "-"}
                </p>
              </div>

              {/* Lead Stage */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Lead Stage
                </label>
                <p className="text-gray-800">
                  {getLeadStageName(referralData.lead_stage_id)}
                </p>
              </div>

              {/* Earning */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Earning
                </label>
                <p className="text-gray-800">
                  {referralData.earning || "-"}
                </p>
              </div>
            </div>

            {/* Created on - Full Width */}
            <div className="mt-6 pb-6 border-b border-gray-200">
              <label className="text-sm text-gray-600 block mb-1">
                Created on
              </label>
              <p className="text-gray-800">
                {formatDateTime(referralData.created_at)}
              </p>
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

            {/* Lead Stage - Dynamic from API */}
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
                  {leadStages.map((stage) => (
                    <SelectItem key={stage.id} value={String(stage.id)}>
                      {stage.lead_stage}
                    </SelectItem>
                  ))}
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
